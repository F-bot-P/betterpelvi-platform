import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

export type ShellyCommandTarget = {
  deviceId?: string | null;
  relay?: number | null;
  mqttTopic?: string | null;
  topicPrefix?: string | null;
};

type MqttCommand = {
  topic: string;
  payload: string;
};

@Injectable()
export class ShellyMqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient | null = null;
  private readonly mqttUrl = process.env.MQTT_URL?.trim() ?? '';
  private readonly mqttUsername = process.env.MQTT_USERNAME?.trim() || undefined;
  private readonly mqttPassword = process.env.MQTT_PASSWORD?.trim() || undefined;
  private readonly connectTimeoutMs = this.parseIntEnv(
    process.env.MQTT_CONNECT_TIMEOUT_MS,
    10000,
  );
  private readonly publishTimeoutMs = this.parseIntEnv(
    process.env.MQTT_PUBLISH_TIMEOUT_MS,
    4000,
  );
  private readonly publishRetries = Math.max(
    1,
    this.parseIntEnv(process.env.MQTT_PUBLISH_RETRIES, 2),
  );
  private readonly rejectUnauthorized =
    (process.env.MQTT_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() !== 'false';

  onModuleInit() {
    if (!this.mqttUrl) {
      console.warn('[MQTT] MQTT_URL is not configured. Shelly control is disabled.');
      return;
    }

    this.client = mqtt.connect(this.mqttUrl, {
      username: this.mqttUsername,
      password: this.mqttPassword,
      reconnectPeriod: 3000,
      connectTimeout: this.connectTimeoutMs,
      keepalive: 30,
      clean: true,
      rejectUnauthorized: this.rejectUnauthorized,
    });

    this.client.on('connect', () => {
      console.log(`[MQTT] Connected: ${this.maskBroker(this.mqttUrl)}`);
    });

    this.client.on('reconnect', () => {
      console.warn('[MQTT] Reconnecting...');
    });

    this.client.on('offline', () => {
      console.warn('[MQTT] Client is offline.');
    });

    this.client.on('close', () => {
      console.warn('[MQTT] Connection closed.');
    });

    this.client.on('error', (err) => {
      console.error('[MQTT] Error:', err.message);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  async turnOn(targetOrDeviceId: ShellyCommandTarget | string, relay = 0) {
    const target = this.normalizeTarget(targetOrDeviceId, relay);
    await this.setPowerState(target, true);
  }

  async turnOff(targetOrDeviceId: ShellyCommandTarget | string, relay = 0) {
    const target = this.normalizeTarget(targetOrDeviceId, relay);
    await this.setPowerState(target, false);
  }

  private normalizeTarget(
    targetOrDeviceId: ShellyCommandTarget | string,
    relay: number,
  ): ShellyCommandTarget {
    if (typeof targetOrDeviceId === 'string') {
      return {
        deviceId: targetOrDeviceId,
        relay,
      };
    }

    return {
      deviceId: targetOrDeviceId.deviceId?.trim() || null,
      relay: targetOrDeviceId.relay ?? relay,
      mqttTopic: targetOrDeviceId.mqttTopic?.trim() || null,
      topicPrefix: targetOrDeviceId.topicPrefix?.trim() || null,
    };
  }

  private async setPowerState(target: ShellyCommandTarget, isOn: boolean) {
    const relay = this.normalizeRelay(target.relay);

    if (!target.deviceId && !target.mqttTopic && !target.topicPrefix) {
      throw new Error('Missing Shelly MQTT configuration (device_id/topic_prefix/mqtt_topic).');
    }

    await this.waitUntilConnected();

    const commands = this.buildCommandBurst(target, relay, isOn);

    let successCount = 0;
    const errors: string[] = [];

    for (const command of commands) {
      try {
        await this.publishWithRetry(command.topic, command.payload);
        successCount += 1;
      } catch (error: any) {
        errors.push(`${command.topic}: ${error?.message ?? String(error)}`);
      }
    }

    if (successCount === 0) {
      throw new Error(`Unable to publish MQTT power commands. ${errors.join(' | ')}`);
    }

    console.log(
      `[MQTT] ${isOn ? 'ON' : 'OFF'} burst sent (${successCount}/${commands.length} publishes acknowledged).`,
    );
  }

  private buildCommandBurst(
    target: ShellyCommandTarget,
    relay: number,
    isOn: boolean,
  ): MqttCommand[] {
    const payloadText = isOn ? 'on' : 'off';
    const payloadJson = JSON.stringify({ on: isOn });

    const commands: MqttCommand[] = [];
    const seen = new Set<string>();

    const add = (topic: string, payload: string) => {
      const key = `${topic}::${payload}`;
      const cleanTopic = topic.trim();
      if (!cleanTopic || seen.has(key)) return;
      seen.add(key);
      commands.push({ topic: cleanTopic, payload });
    };

    const prefixCandidates = new Set<string>();
    if (target.topicPrefix) prefixCandidates.add(target.topicPrefix);
    if (target.deviceId) prefixCandidates.add(target.deviceId);

    // Shelly Plug S Gen3 often uses sg3_<mac> as MQTT topic prefix.
    const sg3Match = target.deviceId?.match(/^shellyplugsg3-(.+)$/i);
    if (sg3Match?.[1]) {
      prefixCandidates.add(`sg3_${sg3Match[1].toLowerCase()}`);
    }

    if (target.deviceId) {
      // Shelly Gen2/Gen3 RPC format (fire-and-forget; some firmwares don't reply on src/rpc).
      add(
        `${target.deviceId}/rpc`,
        JSON.stringify({
          id: Date.now(),
          src: 'hebimed-backend',
          method: 'Switch.Set',
          params: { id: relay, on: isOn },
        }),
      );

      // Some compatibility setups use shellies/<id>/rpc.
      add(
        `shellies/${target.deviceId}/rpc`,
        JSON.stringify({
          id: Date.now() + 1,
          src: 'hebimed-backend',
          method: 'Switch.Set',
          params: { id: relay, on: isOn },
        }),
      );

      // Legacy Gen1 command topic.
      add(`shellies/${target.deviceId}/relay/${relay}/command`, payloadText);
      // Legacy compatibility topic used by some firmwares.
      add(`shellies/${target.deviceId}/command`, payloadText);
    }

    for (const prefix of prefixCandidates) {
      // Gen2/Gen3 simple command topic.
      add(`${prefix}/command/switch:${relay}`, payloadText);
      // Some versions accept JSON payload on the same topic.
      add(`${prefix}/command/switch:${relay}`, payloadJson);
      // Some devices map simple command topic without component suffix.
      add(`${prefix}/command`, payloadText);
    }

    if (target.mqttTopic) {
      // Explicit override from DB always included.
      add(target.mqttTopic, payloadText);
      add(target.mqttTopic, payloadJson);
    }

    return commands;
  }

  private async publishWithRetry(topic: string, payload: string) {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.publishRetries; attempt++) {
      try {
        await this.publishOnce(topic, payload);
        return;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[MQTT] Publish attempt ${attempt}/${this.publishRetries} failed for ${topic}: ${lastError.message}`,
        );
      }
    }

    throw lastError ?? new Error(`Publish failed for ${topic}`);
  }

  private async publishOnce(topic: string, payload: string) {
    const client = this.getClientOrThrow();

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Publish timeout for topic ${topic}.`));
      }, this.publishTimeoutMs);

      client.publish(topic, payload, { qos: 1 }, (err) => {
        clearTimeout(timeout);
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }
        resolve();
      });
    });
  }

  private async waitUntilConnected(timeoutMs = this.connectTimeoutMs) {
    const client = this.getClientOrThrow();

    if (client.connected) return;

    await new Promise<void>((resolve, reject) => {
      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('MQTT connection timeout.'));
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        client.off('connect', onConnect);
        client.off('error', onError);
      };

      client.on('connect', onConnect);
      client.on('error', onError);
    });
  }

  private getClientOrThrow() {
    if (!this.mqttUrl) {
      throw new Error('MQTT_URL is missing.');
    }

    if (!this.client) {
      throw new Error('MQTT client is not initialized.');
    }

    return this.client;
  }

  private normalizeRelay(relay: number | null | undefined) {
    const n = Number(relay ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 4) {
      throw new Error('Relay must be an integer between 0 and 4.');
    }
    return n;
  }

  private parseIntEnv(raw: string | undefined, fallback: number) {
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private maskBroker(url: string) {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  }
}

