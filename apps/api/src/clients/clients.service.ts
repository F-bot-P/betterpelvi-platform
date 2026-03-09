import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';
import { randomUUID } from 'crypto';
import { SessionsService } from '../sessions/sessions.service';

type CreateClientInput = {
  full_name: string;
  username?: string;
  location?: string;
  phone?: string;
  email?: string;

  // sessions booked on creation (10,20,30...)
  initial_sessions?: number;
};

type UpdateClientInput = Partial<Omit<CreateClientInput, 'initial_sessions'>>;

type CreditsRow = {
  total_sessions: number;
  remaining_sessions: number;
};

function normalizeCredits(rel: any): CreditsRow {
  const row = Array.isArray(rel) ? rel[0] : rel;
  return {
    total_sessions: Number(row?.total_sessions ?? 0),
    remaining_sessions: Number(row?.remaining_sessions ?? 0),
  };
}

@Injectable()
export class ClientsService {
  constructor(private readonly sessions: SessionsService) {}

  // =========================================================
  // LIST + SEARCH (CLINIC DASHBOARD)
  // =========================================================
  async listClients(clinicId: string, search?: string) {
    let query = supabaseAdmin
      .from('clients')
      .select(
        `
        id,
        full_name,
        username,
        location,
        phone,
        email,
        qr_token,
        created_at,
        client_credits(total_sessions, remaining_sessions)
      `,
      )
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(
        [
          `full_name.ilike.${q}`,
          `username.ilike.${q}`,
          `email.ilike.${q}`,
          `phone.ilike.${q}`,
          `location.ilike.${q}`,
        ].join(','),
      );
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    return (data ?? []).map((c: any) => ({
      ...c,
      client_credits: normalizeCredits(c.client_credits),
    }));
  }

  // =========================================================
  // CREATE CLIENT (QR + INITIAL SESSIONS)
  // =========================================================
  async createClient(clinicId: string, input: CreateClientInput) {
    if (!input.full_name?.trim()) {
      throw new BadRequestException('full_name is required');
    }

    // DEFAULT = 10 sessions
    const total = Number(input.initial_sessions ?? 10);
    if (!Number.isFinite(total) || total < 0) {
      throw new BadRequestException('initial_sessions must be >= 0');
    }

    const qrToken = randomUUID();

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        clinic_id: clinicId,
        full_name: input.full_name.trim(),
        username: input.username?.trim() ?? null,
        location: input.location?.trim() ?? null,
        phone: input.phone?.trim() ?? null,
        email: input.email?.trim() ?? null,
        qr_token: qrToken,
      })
      .select(
        'id, clinic_id, full_name, username, location, phone, email, qr_token, created_at',
      )
      .single();

    if (error) throw new BadRequestException(error.message);

    // IMPORTANT: total_sessions === remaining_sessions on creation
    const { error: crErr } = await supabaseAdmin.from('client_credits').insert({
      client_id: client.id,
      total_sessions: total,
      remaining_sessions: total,
    });

    if (crErr) throw new BadRequestException(crErr.message);

    return client;
  }

  // =========================================================
  // UPDATE CLIENT METADATA
  // =========================================================
  async updateClient(
    clinicId: string,
    clientId: string,
    input: UpdateClientInput,
  ) {
    const { data: existing, error } = await supabaseAdmin
      .from('clients')
      .select('id, clinic_id')
      .eq('id', clientId)
      .single();

    if (error || !existing) throw new BadRequestException('Client not found');
    if (existing.clinic_id !== clinicId)
      throw new ForbiddenException('Client not in your clinic');

    const patch: any = {};
    if (input.full_name !== undefined) patch.full_name = input.full_name?.trim();
    if (input.username !== undefined)
      patch.username = input.username?.trim() ?? null;
    if (input.location !== undefined)
      patch.location = input.location?.trim() ?? null;
    if (input.phone !== undefined) patch.phone = input.phone?.trim() ?? null;
    if (input.email !== undefined) patch.email = input.email?.trim() ?? null;

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('clients')
      .update(patch)
      .eq('id', clientId)
      .select(
        'id, clinic_id, full_name, username, location, phone, email, qr_token, created_at',
      )
      .single();

    if (upErr) throw new BadRequestException(upErr.message);
    return updated;
  }

  // =========================================================
  // DELETE CLIENT (+ linked session/power/auth cleanup)
  // =========================================================
  async deleteClient(clinicId: string, clientId: string) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('clients')
      .select('id, clinic_id, auth_user_id, full_name')
      .eq('id', clientId)
      .single();

    if (existingError || !existing) {
      throw new BadRequestException('Client not found');
    }
    if (existing.clinic_id !== clinicId) {
      throw new ForbiddenException('Client not in your clinic');
    }

    // Safety: stop any active sessions first so chair power is turned OFF.
    const { data: activeSessions, error: activeErr } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (activeErr) throw new BadRequestException(activeErr.message);

    for (const row of activeSessions ?? []) {
      await this.sessions.stopAsClinic(clinicId, row.id);
    }

    const linkedAuthUserId = existing.auth_user_id as string | null;

    if (linkedAuthUserId) {
      const { data: profile, error: profileReadError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', linkedAuthUserId)
        .maybeSingle();

      if (profileReadError) {
        throw new BadRequestException(profileReadError.message);
      }

      // Only delete auth account when profile role is client.
      if (profile?.role === 'client') {
        const { error: profileDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', linkedAuthUserId);

        if (profileDeleteError) {
          throw new BadRequestException(profileDeleteError.message);
        }

        const { error: authDeleteError } =
          await supabaseAdmin.auth.admin.deleteUser(linkedAuthUserId);

        if (
          authDeleteError &&
          !/not found/i.test(authDeleteError.message ?? '')
        ) {
          throw new BadRequestException(authDeleteError.message);
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('clinic_id', clinicId);

    if (deleteError) throw new BadRequestException(deleteError.message);

    return {
      ok: true,
      deleted_client_id: clientId,
      full_name: existing.full_name,
    };
  }

  // =========================================================
  // ADJUST SESSIONS (+10 / -10)
  // =========================================================
  async adjustCredits(
    clinicId: string,
    clientId: string,
    amount: 10 | -10 | 1 | -1,
  ) {
    const { data: c, error } = await supabaseAdmin
      .from('clients')
      .select('id, clinic_id')
      .eq('id', clientId)
      .single();

    if (error || !c) throw new BadRequestException('Client not found');
    if (c.clinic_id !== clinicId)
      throw new ForbiddenException('Client not in your clinic');

    const { error: rpcErr } = await supabaseAdmin.rpc(
      'increment_client_credits',
      {
        client_id_input: clientId,
        amount_input: amount,
      },
    );

    if (rpcErr) throw new BadRequestException(rpcErr.message);
    return { ok: true };
  }

  // =========================================================
  // GET CLIENT (DETAIL PAGE)
  // =========================================================
  async getClient(clinicId: string, clientId: string) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select(
        `
        id,
        clinic_id,
        full_name,
        username,
        location,
        phone,
        email,
        qr_token,
        created_at,
        client_credits(total_sessions, remaining_sessions)
      `,
      )
      .eq('id', clientId)
      .single();

    if (error || !data) throw new BadRequestException('Client not found');
    if (data.clinic_id !== clinicId)
      throw new ForbiddenException('Client not in your clinic');

    return {
      ...data,
      client_credits: normalizeCredits(data.client_credits),
    };
  }
}

