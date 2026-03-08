# Shelly Session Simulation (Phone Charger)

This project controls Shelly power via MQTT whenever a session starts/stops.
Use this checklist before deploying to Render/Vercel/Hetzner.

## 1) Environment (API)

Set these in API env:

- `MQTT_URL` (HiveMQ broker URL, for example `mqtts://YOUR_CLUSTER.s1.eu.hivemq.cloud:8883`)
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- Optional: `MQTT_PUBLISH_RETRIES` (default `3`)
- Optional: `MQTT_CONNECT_TIMEOUT_MS` (default `10000`)
- Optional: `MQTT_PUBLISH_TIMEOUT_MS` (default `6000`)
- Optional: `MQTT_REJECT_UNAUTHORIZED` (default `true`)

## 2) Chair pairing values

Open clinic device page and save the chair config.
For your Shelly Plug S Gen3 id `8cbfeaa036f4`, start with:

- Device ID: `shellyplugsg3-8cbfeaa036f4`
- Relay: `0`
- Topic Prefix: `shellyplugsg3-8cbfeaa036f4` (optional)
- MQTT Command Topic: empty (optional override)

If your Shelly uses a custom command topic, set `MQTT Command Topic` explicitly
(example: `my-topic/command/switch:0`).

## 3) Physical simulation

1. Plug a phone charger into the Shelly plug.
2. Start a client session from either:
   - QR page (`/qr/:token`)
   - Clinic dashboard client page (`Start` button)
3. Confirm charger turns ON immediately.
4. End the session manually and confirm charger turns OFF immediately.
5. Start again and do not stop manually.
6. Confirm session auto-ends after exactly 28 minutes and charger turns OFF.

## 4) Expected backend behavior

- Start checks:
  - client has remaining sessions
  - client has no active session
  - chair has no active session
  - chair has Shelly MQTT config
- On start success:
  - session created with `auto_end_at = started_at + 28 minutes`
  - client credits decremented
  - Shelly ON command sent
- Manual stop:
  - Shelly OFF command sent first
  - then session marked ended
- Auto stop:
  - periodic sweep ends expired sessions and sends Shelly OFF

## 5) Troubleshooting

- If start fails with power-on error, the session is rolled back and credit is restored.
- If auto-end cannot send OFF, the session remains active and is retried on the next sweep.
- Check API logs for `[MQTT]` and `[SESSION]` lines.
