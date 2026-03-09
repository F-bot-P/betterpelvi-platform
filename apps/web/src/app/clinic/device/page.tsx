'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import DeviceSkeleton from '../_ui/DeviceSkeleton';

type Chair = {
  id: string;
  name: string;
  device_id?: string | null;
  mqtt_topic?: string | null;
  topic_prefix?: string | null;
  shelly_relay?: number | null;
};

export default function ClinicDevicePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [chairs, setChairs] = useState<Chair[]>([]);
  const [chairId, setChairId] = useState('');

  const [deviceId, setDeviceId] = useState('');
  const [topicPrefix, setTopicPrefix] = useState('');
  const [mqttTopic, setMqttTopic] = useState('');
  const [relay, setRelay] = useState('0');

  async function loadChairs() {
    setLoading(true);
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace('/clinic/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chairs`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      const list = await res.json();
      const arr: Chair[] = Array.isArray(list) ? list : [];
      setChairs(arr);

      const first = arr[0];
      if (first) {
        applyChairSelection(first);
      } else {
        clearForm();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearForm() {
    setChairId('');
    setDeviceId('');
    setTopicPrefix('');
    setMqttTopic('');
    setRelay('0');
  }

  function applyChairSelection(chair: Chair) {
    setChairId(chair.id);
    setDeviceId(chair.device_id ?? '');
    setTopicPrefix(chair.topic_prefix ?? '');
    setMqttTopic(chair.mqtt_topic ?? '');
    setRelay(String(chair.shelly_relay ?? 0));
  }

  function onSelectChair(id: string) {
    const selected = chairs.find((x) => x.id === id);
    if (!selected) return;
    applyChairSelection(selected);
  }

  async function save() {
    const { data } = await supabaseBrowser.auth.getSession();
    const session = data.session;
    if (!session) return router.replace('/clinic/login');

    if (!chairId) return alert('No chair selected');

    const relayNumber = Number(relay);
    if (!Number.isInteger(relayNumber) || relayNumber < 0 || relayNumber > 4) {
      return alert('Relay must be an integer between 0 and 4.');
    }

    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chairs/${chairId}/pair`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            device_id: deviceId.trim() || null,
            topic_prefix: topicPrefix.trim() || null,
            mqtt_topic: mqttTopic.trim() || null,
            shelly_relay: relayNumber,
          }),
        },
      );

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      alert('Device saved');
      await loadChairs();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <DeviceSkeleton />;

  return (
    <div style={panel()}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 900 }}>Pair device</div>
        <Link href="/clinic" style={{ textDecoration: 'none' }}>
          <button style={btnGhost()}>Back</button>
        </Link>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        <label style={label()}>Chair</label>
        <select
          style={input()}
          value={chairId}
          onChange={(e) => onSelectChair(e.target.value)}
        >
          {chairs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label style={label()}>Device ID (from Shelly app)</label>
        <input
          style={input()}
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="e.g. shellyplugsg3-8cbfeaa036f4"
        />

        <label style={label()}>Topic Prefix (optional, recommended for SG3)</label>
        <input
          style={input()}
          value={topicPrefix}
          onChange={(e) => setTopicPrefix(e.target.value)}
          placeholder="e.g. sg3_8cbfeaa036f4"
        />

        <label style={label()}>MQTT Command Topic (advanced override)</label>
        <input
          style={input()}
          value={mqttTopic}
          onChange={(e) => setMqttTopic(e.target.value)}
          placeholder="e.g. shellyplugsg3-8cbfeaa036f4/command/switch:0"
        />

        <label style={label()}>Relay (0-4)</label>
        <input
          style={input()}
          value={relay}
          onChange={(e) => setRelay(e.target.value)}
          inputMode="numeric"
          placeholder="0"
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button style={btnPrimary()} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Confirm'}
          </button>
          <button style={btnGhost()} onClick={loadChairs} disabled={saving}>
            Refresh
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.62)', marginTop: 6 }}>
          Clinic field guide:
          <br />1) Chair: choose the exact physical chair you are pairing.
          <br />2) Device ID: enter the Shelly device id/hostname shown in Shelly app.
          <br />3) Topic Prefix: for Plug S Gen3 use the MQTT prefix from Shelly (often <b>sg3_&lt;device-mac&gt;</b>).
          <br />4) MQTT Command Topic: leave empty unless support gives you a custom topic.
          <br />5) Relay: keep <b>0</b> for a single-outlet Shelly plug.
          <br />6) Press Confirm, then test start/end from dashboard or QR page.
        </div>
      </div>
    </div>
  );
}

function panel(): React.CSSProperties {
  return {
    background: '#ffffff',
    border: '1px solid #141414',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    minHeight: 240,
    maxWidth: 720,
    margin: '0 auto',
  };
}

function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #606162',
    background: '#e8e8e9',
    color: '#111827',
    outline: 'none',
  };
}

function label(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    color: 'rgba(0,0,0,0.65)',
    marginTop: 6,
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '2px solid #171717',
    background: '#ffffff',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: 900,
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 10,
    border: '2px solid #111827',
    background: '#ffffff',
    color: '#f15b5b',
    fontWeight: 900,
    cursor: 'pointer',
  };
}

