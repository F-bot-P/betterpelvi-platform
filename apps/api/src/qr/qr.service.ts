import { BadRequestException, Injectable } from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';
import { SessionsService } from '../sessions/sessions.service';
import * as crypto from 'crypto';

function hashQrToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class QrService {
  constructor(private readonly sessions: SessionsService) {}

  // =========================================================
  // 🔐 Resolve QR → Client (single source of truth)
  // =========================================================
  private async resolveClient(rawToken: string) {
    const tokenHash = hashQrToken(rawToken);

    const { data, error } = await supabaseAdmin
      .from('qr_tokens')
      .select(
        `
        client_id,
        clients : clients!inner (
          id,
          clinic_id,
          full_name
        )
      `,
      )
      .eq('token_hash', tokenHash)
      .eq('active', true)
      .single();

    if (error || !data || !data.clients) {
      throw new BadRequestException('Invalid or expired QR token');
    }

    const client = Array.isArray(data.clients) ? data.clients[0] : data.clients;

    if (!client) {
      throw new BadRequestException('Invalid or expired QR token');
    }

    return {
      clientId: client.id,
      clinicId: client.clinic_id,
      fullName: client.full_name,
    };
  }

  // =========================================================
  // 🔍 LOAD CLIENT (QR PAGE)
  // =========================================================
  async getByToken(rawToken: string) {
    const { clientId, clinicId, fullName } = await this.resolveClient(rawToken);

    const { data: credits } = await supabaseAdmin
      .from('client_credits')
      .select('total_sessions, remaining_sessions')
      .eq('client_id', clientId)
      .single();

    const active = await this.sessions.getActiveSessionForClient(
      clinicId,
      clientId,
    );

    const { data: history } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        started_at,
        ended_at,
        ended_reason,
        status,
        chair_id
      `,
      )
      .eq('client_id', clientId)
      .eq('clinic_id', clinicId)
      .order('started_at', { ascending: false })
      .limit(100);

    return {
      id: clientId,
      clinic_id: clinicId,
      full_name: fullName,
      credits: {
        total_sessions: Number(credits?.total_sessions ?? 0),
        remaining_sessions: Number(credits?.remaining_sessions ?? 0),
      },
      active,
      history: history ?? [],
    };
  }

  async startByQr(rawToken: string) {
    const { clientId, clinicId, fullName } = await this.resolveClient(rawToken);

    let active = await this.sessions.getActiveSessionForClient(
      clinicId,
      clientId,
    );

    if (!active) {
      const { data: chair } = await supabaseAdmin
        .from('chairs')
        .select('id')
        .eq('clinic_id', clinicId)
        .neq('is_active', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!chair) {
        throw new BadRequestException('Chair not configured');
      }

      active = await this.sessions.startAsClinic(clinicId, clientId, chair.id);
    }

    // 🔁 ALWAYS return full QR page state
    return this.getByToken(rawToken);
  }

  async stopByQr(rawToken: string) {
    const { clientId, clinicId } = await this.resolveClient(rawToken);

    const active = await this.sessions.getActiveSessionForClient(
      clinicId,
      clientId,
    );

    if (!active) {
      throw new BadRequestException('No active session');
    }

    await this.sessions.stopAsClinic(clinicId, active.id);

    // 🔁 ALWAYS return full QR page state
    return this.getByToken(rawToken);
  }
  async createQrForClient(clientId: string) {
    const rawToken = crypto.randomUUID();
    const tokenHash = hashQrToken(rawToken);

    // deactivate old tokens (optional but recommended)
    await supabaseAdmin
      .from('qr_tokens')
      .update({ active: false })
      .eq('client_id', clientId);

    const { error } = await supabaseAdmin.from('qr_tokens').insert({
      client_id: clientId,
      token_hash: tokenHash,
      active: true,
    });

    if (error) {
      throw new BadRequestException('Failed to create QR token');
    }

    return {
      token: rawToken, // ONLY return raw token
    };
  }
}
