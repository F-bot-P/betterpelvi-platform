import { Injectable, BadRequestException } from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class DashboardService {
  constructor(private readonly sessions: SessionsService) {}

  /**
   * Clients with credits
   */
  async getClients(clinicId: string) {
    // 🔥 ENFORCE AUTO-END (restart safe)
    await this.sessions.autoEndExpiredSessions();

    const { data, error } = await supabaseAdmin
      .from('clients')
      .select(
        `
        id,
        full_name,
        username,
        phone,
        email,
        location,
        qr_token,
        created_at,
        client_credits (
          remaining_sessions
        ),
        sessions (
          id,
          status
        )
      `,
      )
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return (data ?? []).map((c: any) => ({
      id: c.id,
      full_name: c.full_name,
      username: c.username,
      phone: c.phone,
      email: c.email,
      location: c.location,
      qr_token: c.qr_token,
      created_at: c.created_at,
      credits: c.client_credits?.[0]?.remaining_sessions ?? 0,
      activeSession: (c.sessions ?? []).some((s: any) => s.status === 'active'),
    }));
  }

  /**
   * Active sessions
   */
  async getActiveSessions(clinicId: string) {
    // 🔥 ENFORCE AUTO-END (restart safe)
    await this.sessions.autoEndExpiredSessions();

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        client_id,
        chair_id,
        started_at,
        auto_end_at,
        status,
        clients (
          full_name
        ),
        chairs (
          name
        )
      `,
      )
      .eq('clinic_id', clinicId)
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return (data ?? []).map((s: any) => ({
      id: s.id,
      client_id: s.client_id,
      client_name: s.clients?.full_name ?? null,
      chair_id: s.chair_id,
      chair_name: s.chairs?.name ?? null,
      started_at: s.started_at,
      auto_end_at: s.auto_end_at,
      status: s.status,
    }));
  }
}
