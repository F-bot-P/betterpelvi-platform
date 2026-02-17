import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';
import { ShellyMqttService } from '../lib/shelly-mqtt.service';

type ChairRow = {
  id: string;
  clinic_id: string;
  is_active: boolean | null;
  device_id: string | null;
  shelly_relay?: number | null;
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
export class SessionsService {
  private SESSION_MINUTES = 28;

  constructor(private readonly shellyMQTT: ShellyMqttService) {}

  // ============================================================
  // 🧹 AUTO END EXPIRED
  // ============================================================
  async autoEndExpiredSessions() {
    const now = new Date().toISOString();

    const { data: expired, error } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        chairs (
          device_id,
          shelly_relay
        )
      `,
      )
      .eq('status', 'active')
      .lt('auto_end_at', now);

    if (error) throw new BadRequestException(error.message);
    if (!expired?.length) return;

    for (const s of expired as any[]) {
      await supabaseAdmin
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: now,
          ended_reason: 'auto',
        })
        .eq('id', s.id)
        .eq('status', 'active');

      const chair = Array.isArray(s.chairs) ? s.chairs[0] : s.chairs;

      if (chair?.device_id) {
        try {
          await this.shellyMQTT.turnOff(
            chair.device_id,
            chair.shelly_relay ?? 0,
          );
        } catch (e) {
          console.error('MQTT auto-off failed', s.id, e);
        }
      }
    }
  }

  // ============================================================
  // ▶️ START SESSION
  // ============================================================
  async startAsClinic(clinicId: string, clientId: string, chairId: string) {
    await this.autoEndExpiredSessions();

    const { data: chair } = await supabaseAdmin
      .from('chairs')
      .select('id, clinic_id, is_active, device_id, shelly_relay')
      .eq('id', chairId)
      .single<ChairRow>();

    if (!chair) throw new BadRequestException('Chair not found');
    if (chair.clinic_id !== clinicId)
      throw new ForbiddenException('Chair not in your clinic');
    if (chair.is_active === false)
      throw new BadRequestException('Chair inactive');

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, clinic_id')
      .eq('id', clientId)
      .single();

    if (!client) throw new BadRequestException('Client not found');
    if (client.clinic_id !== clinicId)
      throw new ForbiddenException('Client not in your clinic');

    const { data: credits } = await supabaseAdmin
      .from('client_credits')
      .select('remaining_sessions')
      .eq('client_id', clientId)
      .single();

    if (!credits || credits.remaining_sessions < 1)
      throw new BadRequestException('No sessions remaining');

    const { data: active } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .limit(1);

    if (active?.length) {
      throw new BadRequestException('Client already has an active session');
    }

    const startedAt = new Date();
    const autoEndAt = new Date(
      startedAt.getTime() + this.SESSION_MINUTES * 60 * 1000,
    );

    const { data: session } = await supabaseAdmin
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

    if (!session) {
      throw new BadRequestException('Failed to start session');
    }

    await supabaseAdmin.rpc('increment_client_credits', {
      client_id_input: clientId,
      amount_input: -1,
    });

    if (chair.device_id) {
      await this.shellyMQTT.turnOn(chair.device_id, chair.shelly_relay ?? 0);
    }

    return session;
  }

  // ============================================================
  // ⏹ STOP SESSION
  // ============================================================
  async stopAsClinic(clinicId: string, sessionId: string) {
    await this.autoEndExpiredSessions();

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        clinic_id,
        status,
        chairs (
          device_id,
          shelly_relay
        )
      `,
      )
      .eq('id', sessionId)
      .single<any>();

    if (!session) throw new BadRequestException('Session not found');
    if (session.clinic_id !== clinicId)
      throw new ForbiddenException('Session not in your clinic');
    if (session.status !== 'active')
      throw new BadRequestException('Session already ended');

    const now = new Date().toISOString();

    await supabaseAdmin
      .from('sessions')
      .update({
        status: 'ended',
        ended_at: now,
        ended_reason: 'clinic',
      })
      .eq('id', sessionId);

    const chair = Array.isArray(session.chairs)
      ? session.chairs[0]
      : session.chairs;

    if (chair?.device_id) {
      await this.shellyMQTT.turnOff(chair.device_id, chair.shelly_relay ?? 0);
    }

    return { ok: true };
  }

  // ============================================================
  // 🔎 ACTIVE SESSION
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
  // 📜 HISTORY
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
}
