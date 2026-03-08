import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';
import {
  ShellyCommandTarget,
  ShellyMqttService,
} from '../lib/shelly-mqtt.service';

type ChairRow = {
  id: string;
  clinic_id: string;
  is_active: boolean | null;
  device_id: string | null;
  shelly_relay?: number | null;
  mqtt_topic?: string | null;
  topic_prefix?: string | null;
};

type SessionRow = {
  id: string;
  clinic_id: string;
  client_id: string;
  chair_id: string | null;
  status: 'active' | 'ended';
  started_at: string;
  auto_end_at: string;
  ended_at: string | null;
  ended_reason: string | null;
};

@Injectable()
export class SessionsService implements OnModuleInit, OnModuleDestroy {
  private readonly SESSION_MINUTES = 28;
  private readonly AUTO_END_SWEEP_MS = 15000;

  private autoEndTimer: ReturnType<typeof setInterval> | null = null;
  private autoEndInFlight = false;

  constructor(private readonly shellyMQTT: ShellyMqttService) {}

  onModuleInit() {
    this.autoEndTimer = setInterval(() => {
      void this.autoEndExpiredSessions('interval').catch((error) => {
        console.error('[SESSION] periodic auto-end failed', error);
      });
    }, this.AUTO_END_SWEEP_MS);

    setTimeout(() => {
      void this.autoEndExpiredSessions('startup').catch((error) => {
        console.error('[SESSION] startup auto-end failed', error);
      });
    }, 3000);
  }

  onModuleDestroy() {
    if (this.autoEndTimer) {
      clearInterval(this.autoEndTimer);
      this.autoEndTimer = null;
    }
  }

  // ============================================================
  // AUTO END EXPIRED
  // ============================================================
  async autoEndExpiredSessions(source = 'manual') {
    if (this.autoEndInFlight) return;

    this.autoEndInFlight = true;

    try {
      const now = new Date().toISOString();

      const { data: expired, error } = await supabaseAdmin
        .from('sessions')
        .select(
          `
          id,
          chairs (
            device_id,
            shelly_relay,
            mqtt_topic,
            topic_prefix
          )
        `,
        )
        .eq('status', 'active')
        .lt('auto_end_at', now);

      if (error) throw new BadRequestException(error.message);
      if (!expired?.length) return;

      for (const session of expired as any[]) {
        const chair = this.extractChair(session?.chairs);
        const commandTarget = this.toCommandTarget(chair);

        // Safety first: only mark ended after OFF command succeeds.
        if (commandTarget) {
          try {
            await this.shellyMQTT.turnOff(commandTarget);
          } catch (error) {
            console.error(
              `[SESSION] auto-end OFF failed for ${session.id} (${source})`,
              error,
            );
            continue;
          }
        }

        const { error: updateError } = await supabaseAdmin
          .from('sessions')
          .update({
            status: 'ended',
            ended_at: now,
            ended_reason: 'auto',
          })
          .eq('id', session.id)
          .eq('status', 'active');

        if (updateError) {
          console.error(
            `[SESSION] failed to finalize auto-end for ${session.id}`,
            updateError,
          );
        }
      }
    } finally {
      this.autoEndInFlight = false;
    }
  }

  // ============================================================
  // START SESSION
  // ============================================================
  async startAsClinic(clinicId: string, clientId: string, chairId: string) {
    await this.autoEndExpiredSessions();

    const { data: chair, error: chairError } = await supabaseAdmin
      .from('chairs')
      .select(
        'id, clinic_id, is_active, device_id, shelly_relay, mqtt_topic, topic_prefix',
      )
      .eq('id', chairId)
      .single<ChairRow>();

    if (chairError) throw new BadRequestException(chairError.message);
    if (!chair) throw new BadRequestException('Chair not found');
    if (chair.clinic_id !== clinicId)
      throw new ForbiddenException('Chair not in your clinic');
    if (chair.is_active === false)
      throw new BadRequestException('Chair inactive');

    const commandTarget = this.toCommandTarget(chair);
    if (!commandTarget) {
      throw new BadRequestException(
        'Chair is not paired with Shelly MQTT settings.',
      );
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, clinic_id')
      .eq('id', clientId)
      .single();

    if (clientError) throw new BadRequestException(clientError.message);
    if (!client) throw new BadRequestException('Client not found');
    if (client.clinic_id !== clinicId)
      throw new ForbiddenException('Client not in your clinic');

    const { data: credits, error: creditsError } = await supabaseAdmin
      .from('client_credits')
      .select('remaining_sessions')
      .eq('client_id', clientId)
      .single();

    if (creditsError) throw new BadRequestException(creditsError.message);
    if (!credits || credits.remaining_sessions < 1) {
      throw new BadRequestException('No sessions remaining');
    }

    const { data: activeForClient, error: activeClientError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .limit(1);

    if (activeClientError) throw new BadRequestException(activeClientError.message);
    if (activeForClient?.length) {
      throw new BadRequestException('Client already has an active session');
    }

    const { data: activeForChair, error: activeChairError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('chair_id', chairId)
      .eq('status', 'active')
      .limit(1);

    if (activeChairError) throw new BadRequestException(activeChairError.message);
    if (activeForChair?.length) {
      throw new BadRequestException('Chair is already in use');
    }

    const startedAt = new Date();
    const autoEndAt = new Date(
      startedAt.getTime() + this.SESSION_MINUTES * 60 * 1000,
    );

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        clinic_id: clinicId,
        client_id: clientId,
        chair_id: chairId,
        status: 'active',
        started_at: startedAt.toISOString(),
        auto_end_at: autoEndAt.toISOString(),
      })
      .select()
      .single<SessionRow>();

    if (sessionError) throw new BadRequestException(sessionError.message);
    if (!session) throw new BadRequestException('Failed to start session');

    const { error: debitError } = await supabaseAdmin.rpc('increment_client_credits', {
      client_id_input: clientId,
      amount_input: -1,
    });

    if (debitError) {
      await this.abortFailedStart(session.id, clientId, commandTarget, false, 'credit_debit_failed');
      throw new BadRequestException(
        `Failed to debit session credits: ${debitError.message}`,
      );
    }

    try {
      await this.shellyMQTT.turnOn(commandTarget);
    } catch (error: any) {
      await this.abortFailedStart(
        session.id,
        clientId,
        commandTarget,
        true,
        'power_on_failed',
      );
      throw new BadRequestException(
        `Failed to power on chair: ${error?.message ?? String(error)}`,
      );
    }

    return session;
  }

  // ============================================================
  // STOP SESSION
  // ============================================================
  async stopAsClinic(clinicId: string, sessionId: string) {
    await this.autoEndExpiredSessions();

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        clinic_id,
        status,
        chairs (
          device_id,
          shelly_relay,
          mqtt_topic,
          topic_prefix
        )
      `,
      )
      .eq('id', sessionId)
      .single<any>();

    if (sessionError) throw new BadRequestException(sessionError.message);
    if (!session) throw new BadRequestException('Session not found');
    if (session.clinic_id !== clinicId)
      throw new ForbiddenException('Session not in your clinic');
    if (session.status !== 'active')
      throw new BadRequestException('Session already ended');

    const chair = this.extractChair(session.chairs);
    const commandTarget = this.toCommandTarget(chair);

    if (commandTarget) {
      try {
        await this.shellyMQTT.turnOff(commandTarget);
      } catch (error: any) {
        throw new BadRequestException(
          `Failed to turn off chair. Session is still active. ${error?.message ?? String(error)}`,
        );
      }
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'ended',
        ended_at: now,
        ended_reason: 'clinic',
      })
      .eq('id', sessionId)
      .eq('status', 'active');

    if (updateError) throw new BadRequestException(updateError.message);

    return { ok: true };
  }

  // ============================================================
  // ACTIVE SESSION
  // ============================================================
  async getActiveSessionForClient(clinicId: string, clientId: string) {
    await this.autoEndExpiredSessions();

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1);

    if (error) throw new BadRequestException(error.message);

    return data?.[0] ?? null;
  }

  // ============================================================
  // HISTORY
  // ============================================================
  async listClientHistory(clinicId: string, clientId: string) {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('client_id', clientId)
      .order('started_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data ?? [];
  }

  private extractChair(raw: any): ChairRow | null {
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] ?? null : raw;
  }

  private toCommandTarget(chair: ChairRow | null | undefined): ShellyCommandTarget | null {
    if (!chair) return null;

    const target: ShellyCommandTarget = {
      deviceId: chair.device_id,
      relay: chair.shelly_relay ?? 0,
      mqttTopic: chair.mqtt_topic ?? null,
      topicPrefix: chair.topic_prefix ?? null,
    };

    if (!target.deviceId && !target.mqttTopic && !target.topicPrefix) {
      return null;
    }

    return target;
  }

  private async abortFailedStart(
    sessionId: string,
    clientId: string,
    commandTarget: ShellyCommandTarget,
    restoreCredit: boolean,
    reason: string,
  ) {
    const now = new Date().toISOString();

    try {
      await this.shellyMQTT.turnOff(commandTarget);
    } catch (error) {
      console.error('[SESSION] start rollback OFF failed', sessionId, error);
    }

    const { error: endError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'ended',
        ended_at: now,
        ended_reason: reason,
      })
      .eq('id', sessionId)
      .eq('status', 'active');

    if (endError) {
      console.error('[SESSION] start rollback status update failed', sessionId, endError);
    }

    if (restoreCredit) {
      const { error: creditError } = await supabaseAdmin.rpc(
        'increment_client_credits',
        {
          client_id_input: clientId,
          amount_input: 1,
        },
      );

      if (creditError) {
        console.error('[SESSION] start rollback credit restore failed', sessionId, creditError);
      }
    }
  }
}
