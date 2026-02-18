// // import { Injectable, BadRequestException } from '@nestjs/common';
// // import { supabaseAdmin } from '../lib/supabase-admin';

// // @Injectable()
// // export class ChairsService {
// //   async listForClinic(clinicId: string) {
// //     const { data, error } = await supabaseAdmin
// //       .from('chairs')
// //       .select('id, name, is_active')
// //       .eq('clinic_id', clinicId)
// //       .order('created_at', { ascending: true });

// //     if (error) throw new BadRequestException(error.message);
// //     return data ?? [];
// //   }
// // }
// import { BadRequestException, Injectable } from '@nestjs/common';
// import { supabaseAdmin } from '../lib/supabase-admin';

// @Injectable()
// export class ChairsService {
//   async listForClinic(clinicId: string) {
//     const { data, error } = await supabaseAdmin
//       .from('chairs')
//       .select('id, name, clinic_id, is_active')
//       .eq('clinic_id', clinicId)
//       .order('created_at', { ascending: true });

//     if (error) throw new BadRequestException(error.message);

//     return (data ?? []).filter((c) => c.is_active !== false);
//   }

//   async getDefaultForClinic(clinicId: string) {
//     const list = await this.listForClinic(clinicId);
//     return list[0] ?? null;
//   }
// }

// import { BadRequestException, Injectable } from '@nestjs/common';
// import { supabaseAdmin } from '../lib/supabase-admin';

// @Injectable()
// export class ChairsService {
//   async listForClinic(clinicId: string) {
//     const { data, error } = await supabaseAdmin
//       .from('chairs')
//       .select('id, name, clinic_id, is_active')
//       .eq('clinic_id', clinicId)
//       .eq('is_active', true)
//       .order('created_at', { ascending: true });

//     if (error) {
//       throw new BadRequestException(error.message);
//     }

//     return data ?? [];
//   }
// }
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';

type PairChairDto = {
  device_id?: string | null;
  shelly_url?: string | null;
  shelly_relay?: number | null;
  mqtt_topic?: string | null;
  topic_prefix?: string | null;
  auto_power_off_seconds?: number | null;
};

@Injectable()
export class ChairsService {
  async listForClinic(clinicId: string) {
    const { data, error } = await supabaseAdmin
      .from('chairs')
      .select(
        'id, name, clinic_id, is_active, device_id, shelly_url, shelly_relay, mqtt_topic, topic_prefix, auto_power_off_seconds',
      )
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getForClinic(clinicId: string, chairId: string) {
    const { data, error } = await supabaseAdmin
      .from('chairs')
      .select(
        'id, name, clinic_id, is_active, device_id, shelly_url, shelly_relay, mqtt_topic, topic_prefix, auto_power_off_seconds',
      )
      .eq('id', chairId)
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Chair not found');
    if (data.clinic_id !== clinicId)
      throw new ForbiddenException('Not your chair');

    return data;
  }

  async pairForClinic(clinicId: string, chairId: string, dto: PairChairDto) {
    // Ensure chair belongs to clinic
    await this.getForClinic(clinicId, chairId);

    // Basic validation (keep it light but safe)
    if (dto.shelly_url && !dto.shelly_url.startsWith('http')) {
      throw new BadRequestException('shelly_url must start with http or https');
    }
    if (
      dto.shelly_relay != null &&
      (!Number.isInteger(dto.shelly_relay) ||
        dto.shelly_relay < 0 ||
        dto.shelly_relay > 4)
    ) {
      throw new BadRequestException(
        'shelly_relay must be an integer between 0 and 4',
      );
    }
    if (
      dto.auto_power_off_seconds != null &&
      (!Number.isInteger(dto.auto_power_off_seconds) ||
        dto.auto_power_off_seconds < 0)
    ) {
      throw new BadRequestException(
        'auto_power_off_seconds must be a non-negative integer',
      );
    }

    const patch: PairChairDto = {
      device_id: dto.device_id ?? null,
      shelly_url: dto.shelly_url ?? null,
      shelly_relay: dto.shelly_relay ?? 0,
      mqtt_topic: dto.mqtt_topic ?? null,
      topic_prefix: dto.topic_prefix ?? null,
      auto_power_off_seconds: dto.auto_power_off_seconds ?? 1680,
    };

    const { data, error } = await supabaseAdmin
      .from('chairs')
      .update(patch)
      .eq('id', chairId)
      .select(
        'id, name, clinic_id, is_active, device_id, shelly_url, shelly_relay, mqtt_topic, topic_prefix, auto_power_off_seconds',
      )
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
  async updateDeviceForClinic(clinicId: string, chairId: string, body: any) {
    const device_id = (body?.device_id ?? '').toString().trim() || null;
    const mqtt_topic = (body?.mqtt_topic ?? '').toString().trim() || null;
    const topic_prefix = (body?.topic_prefix ?? '').toString().trim() || null;
    const shelly_url = (body?.shelly_url ?? '').toString().trim() || null;

    const shelly_relay =
      body?.shelly_relay === '' ||
      body?.shelly_relay === null ||
      body?.shelly_relay === undefined
        ? null
        : Number(body.shelly_relay);

    if (
      shelly_relay !== null &&
      (!Number.isFinite(shelly_relay) || shelly_relay < 0)
    ) {
      throw new BadRequestException('Invalid shelly_relay');
    }

    // IMPORTANT: scope update to this clinic only
    const { data, error } = await supabaseAdmin
      .from('chairs')
      .update({
        device_id,
        mqtt_topic,
        topic_prefix,
        shelly_url,
        shelly_relay,
      })
      .eq('id', chairId)
      .eq('clinic_id', clinicId)
      .select(
        'id, name, clinic_id, is_active, device_id, mqtt_topic, topic_prefix, shelly_url, shelly_relay',
      )
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
