# Shelly Plug Clinic Setup Guide (BetterPelvi)

This guide is for clinics receiving a Shelly Plug S (Gen3) for chair power control.

## 1) Prerequisites

- Shelly Plug S Gen3 device (powered on)
- Clinic Wi-Fi with internet access (2.4 GHz recommended)
- Shelly Smart Control app installed on phone
- Clinic dashboard access in BetterPelvi (`/clinic/device` page)
- MQTT broker credentials from your platform admin:
  - Broker host and port
  - Username
  - Password
  - SSL requirement

## 2) Add Plug to Shelly App

1. Open Shelly Smart Control app.
2. Add device and follow onboarding until the plug appears online.
3. Rename the device clearly (example: `Chair 1 Plug`).
4. Update firmware if the app offers an update.
5. Confirm manual ON/OFF from Shelly app works before continuing.

## 3) Enable MQTT on Shelly

1. Open the device in Shelly app.
2. Go to `Settings` -> `Internet & Security` -> `MQTT`.
3. Enable `MQTT`.
4. Set broker host and port exactly as provided (example: `cluster.s2.eu.hivemq.cloud:8883`).
5. Turn on `SSL connectivity` when using TLS broker port (usually 8883).
6. Certificate field:
   - Use `*` unless your broker team gave a specific cert file.
7. Keep `Client ID` as Shelly default unless instructed otherwise.
8. Enter MQTT username and password exactly.
9. Save settings.
10. Reboot the Shelly device.
11. Re-open MQTT page and confirm status shows `Device is connected`.

## 4) Find Values Needed for BetterPelvi Pair Device Form

Open BetterPelvi `Clinic -> Pair device`.

Fill fields like this:

1. `Chair`
- Select the physical chair this plug controls.

2. `Device ID`
- Use Shelly device ID/hostname shown in Shelly app (example: `shellyplugsg3-8cbfeaa036f4`).

3. `Topic Prefix` (recommended for Plug S Gen3)
- Use the MQTT topic root used by the device.
- For SG3 this is commonly `sg3_<device-mac>` (example: `sg3_8cbfeaa036f4`).
- If unknown, check broker logs for status topics from the plug.

4. `MQTT Command Topic`
- Leave empty in normal setup.
- Only fill if support gives an explicit custom topic.

5. `Relay`
- Use `0` for single-outlet Shelly Plug.

6. Click `Confirm`.

## 5) End-to-End Test (Before Chair Deployment)

Use a phone charger as safe load for validation.

1. Plug charger into Shelly plug.
2. Start session from clinic dashboard:
- Plug should turn ON immediately.
- Charger should start charging.
3. End session manually:
- Plug should turn OFF immediately.
- Charging should stop.
4. Start session from QR page:
- Same ON behavior.
5. End from QR page:
- Same OFF behavior.
6. Auto-stop test:
- Start a session and wait 28 minutes.
- Session must auto-end and plug must turn OFF.

## 6) Expected Production Behavior

- Session start is valid only when availability/credits checks pass.
- Physical relay must turn ON for session start to be considered successful.
- Manual stop turns relay OFF first, then marks session ended.
- Auto-stop (28 minutes) turns relay OFF and ends session.

## 7) Troubleshooting

### MQTT page says "Device is disconnected"

- Re-check broker host:port.
- Re-check username/password (exact, case-sensitive).
- Ensure SSL toggle matches broker port.
- Save and reboot again.
- Ensure clinic Wi-Fi has internet and no outbound block on broker port.

### Session starts in UI but plug does not turn ON

- `Device ID` or `Topic Prefix` is likely wrong.
- Check broker monitor for incoming plug status topics.
- Set `Topic Prefix` to the exact prefix observed.
- Keep `Relay = 0` for plug.

### Plug turns ON/OFF in Shelly app but not from BetterPelvi

- Verify backend MQTT env vars are set in deployed API service.
- Check API logs for MQTT publish errors/timeouts.
- Confirm broker receives publish to command topic.

### Auto-stop did not switch OFF

- Verify backend API worker/process is running continuously.
- Check session `auto_end_at` and API logs around that timestamp.

## 8) Go-Live Checklist

- Shelly app manual control tested
- MQTT status connected
- Pair device form saved with correct values
- Dashboard start/end controls plug power
- QR start/end controls plug power
- 28-minute auto-stop confirmed

