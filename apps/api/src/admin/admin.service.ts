import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ClinicProvisioningService,
  CreateClinicAccountInput,
} from '../auth/clinic-provisioning.service';
import { supabaseAdmin } from '../lib/supabase-admin';

type ClinicRow = {
  id: string;
  name: string;
  created_at: string;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly clinicProvisioning: ClinicProvisioningService,
  ) {}

  async getOverview() {
    const [clinicsResult, chairsResult, clientsResult, sessionsResult] =
      await Promise.all([
        supabaseAdmin
          .from('clinics')
          .select('id, name, created_at')
          .order('created_at', { ascending: false }),
        supabaseAdmin.from('chairs').select('clinic_id'),
        supabaseAdmin.from('clients').select('clinic_id'),
        supabaseAdmin
          .from('sessions')
          .select('clinic_id')
          .eq('status', 'active'),
      ]);

    const error =
      clinicsResult.error ||
      chairsResult.error ||
      clientsResult.error ||
      sessionsResult.error;

    if (error) {
      throw new BadRequestException(error.message);
    }

    const countByClinic = (rows: Array<{ clinic_id: string }> | null) => {
      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        counts.set(row.clinic_id, (counts.get(row.clinic_id) ?? 0) + 1);
      }
      return counts;
    };

    const chairCounts = countByClinic(chairsResult.data);
    const clientCounts = countByClinic(clientsResult.data);
    const activeSessionCounts = countByClinic(sessionsResult.data);
    const clinics = (clinicsResult.data ?? []).map((clinic: ClinicRow) => ({
      ...clinic,
      chairCount: chairCounts.get(clinic.id) ?? 0,
      clientCount: clientCounts.get(clinic.id) ?? 0,
      activeSessionCount: activeSessionCounts.get(clinic.id) ?? 0,
    }));

    return {
      clinics,
      totals: {
        clinics: clinics.length,
        chairs: (chairsResult.data ?? []).length,
        clients: (clientsResult.data ?? []).length,
        activeSessions: (sessionsResult.data ?? []).length,
      },
    };
  }

  async createClinic(input: CreateClinicAccountInput) {
    return this.clinicProvisioning.createClinicAccount(input);
  }
}
