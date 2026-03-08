import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

export type ShellyCommandTarget = {
  deviceId?: string | null;
  relay?: number | null;
  mqttTopic?: string | null;
  topicPrefix?: string | null;
};

type PendingRpc = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
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
    6000,
  );
  private readonly publishRetries = Math.max(
    1,
    this.parseIntEnv(process.env.MQTT_PUBLISH_RETRIES, 3),
  );
  private readonly rejectUnauthorized =
    (process.env.MQTT_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() !== 'false';
  private readonly rpcSource =
    process.env.MQTT_RPC_SOURCE?.trim() ?? `hebimed-backend-${process.pid}`;
  private readonly rpcResponseTopic = `${this.rpcSource}/rpc`;

  private readonly pendingRpc = new Map<number, PendingRpc>();
  private rpcRequestCounter = 0;

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
      this.subscribeRpcResponses();
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

    this.client.on('message', (topic, payload) => {
      this.handleIncomingMessage(topic, payload);
    });
  }

  onModuleDestroy() {
    for (const [, pending] of this.pendingRpc) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('MQTT service stopped before receiving RPC response.'));
    }
    this.pendingRpc.clear();

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
    const desiredState = isOn ? 'on' : 'off';

    if (!target.deviceId && !target.mqttTopic && !target.topicPrefix) {
      throw new Error('Missing Shelly MQTT configuration (device_id/topic_prefix/mqtt_topic).');
    }

    const errors: string[] = [];

    // Shelly Gen2/Gen3 RPC gives a response, so it is the most reliable first attempt.
    if (target.deviceId) {
      try {
        await this.publishRpcSwitch(target.deviceId, relay, isOn);
        console.log(
          `[MQTT] RPC acknowledged ${desiredState.toUpperCase()} for ${target.deviceId} relay ${relay}`,
        );
        return;
      } catch (error: any) {
        errors.push(`RPC: ${error?.message ?? String(error)}`);
      }
    }

    const fallbackCommands = this.buildFallbackCommands(target, desiredState, relay);

    for (const command of fallbackCommands) {
      try {
        await this.publishWithRetry(command.topic, command.payload);
        console.log(
          `[MQTT] Command published ${desiredState.toUpperCase()} to topic ${command.topic}`,
        );
        return;
      } catch (error: any) {
        errors.push(`${command.topic}: ${error?.message ?? String(error)}`);
      }
    }

    throw new Error(`Unable to send MQTT ${desiredState.toUpperCase()} command. ${errors.join(' | ')}`);
  }

  private buildFallbackCommands(
    target: ShellyCommandTarget,
    payload: string,
    relay: number,
  ): MqttCommand[] {
    const commands: MqttCommand[] = [];
    const dedupe = new Set<string>();

    const add = (topic: string, topicPayload = payload) => {
      const cleanTopic = topic.trim();
      if (!cleanTopic || dedupe.has(cleanTopic)) return;
      dedupe.add(cleanTopic);
      commands.push({ topic: cleanTopic, payload: topicPayload });
    };

    if (target.mqttTopic) {
      add(target.mqttTopic);
      return commands;
    }

    const prefix = target.topicPrefix || target.deviceId || null;
    if (prefix) {
      // Shelly Gen2/Gen3 control topic when MQTT control is enabled.
      add(`${prefix}/command/switch:${relay}`);
    }

    if (target.deviceId) {
      // Shelly Gen1 legacy topic.
      add(`shellies/${target.deviceId}/relay/${relay}/command`);
    }

    return commands;
  }

  private async publishRpcSwitch(deviceId: string, relay: number, isOn: boolean) {
    const rpcId = this.nextRpcId();
    const waitForResponse = this.waitForRpcResponse(rpcId);
    waitForResponse.catch(() => undefined);

    const payload = JSON.stringify({
      id: rpcId,
      src: this.rpcSource,
      method: 'Switch.Set',
      params: { id: relay, on: isOn },
    });

    try {
      await this.publishWithRetry(`${deviceId}/rpc`, payload);
      await waitForResponse;
    } catch (error) {
      this.cancelPendingRpc(rpcId, `RPC command failed for ${deviceId}`);
      throw error;
    }
  }

  private waitForRpcResponse(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRpc.delete(id);
        reject(new Error(`Timed out waiting for RPC response ${id}.`));
      }, this.publishTimeoutMs);

      this.pendingRpc.set(id, {
        resolve: () => {
          clearTimeout(timeout);
          this.pendingRpc.delete(id);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timeout);
          this.pendingRpc.delete(id);
          reject(error);
        },
        timeout,
      });
    });
  }

  private cancelPendingRpc(id: number, reason: string) {
    const pending = this.pendingRpc.get(id);
    if (!pending) return;

    pending.reject(new Error(reason));
  }

  private handleIncomingMessage(topic: string, payload: Buffer) {
    if (topic !== this.rpcResponseTopic) return;

    let message: any;
    try {
      message = JSON.parse(payload.toString('utf8'));
    } catch {
      return;
    }

    if (typeof message?.id !== 'number') return;

    const pending = this.pendingRpc.get(message.id);
    if (!pending) return;

    if (message.error) {
      pending.reject(new Error(JSON.stringify(message.error)));
      return;
    }

    pending.resolve();
  }

  private subscribeRpcResponses() {
    if (!this.client?.connected) return;

    this.client.subscribe(this.rpcResponseTopic, { qos: 1 }, (err) => {
      if (err) {
        console.error(
          `[MQTT] Failed subscribing to ${this.rpcResponseTopic}: ${err.message}`,
        );
      } else {
        console.log(`[MQTT] Listening for RPC responses on ${this.rpcResponseTopic}`);
      }
    });
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
    await this.waitUntilConnected();

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

  private nextRpcId() {
    this.rpcRequestCounter = (this.rpcRequestCounter + 1) % 1_000_000_000;
    return this.rpcRequestCounter;
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


