# Platform Operations Setup

BetterPelvi now separates clinic access from platform operations:

- Clinic administrators and clinic staff sign in at `/clinic/login`.
- Public self-registration no longer creates clinic accounts.
- A platform operator signs in at `/admin/login` and creates each clinic, its first clinic administrator, and `Chair 1` together.
- Existing Shelly MQTT, QR, chair, client, and session routes are unchanged.

## Enable Platform Operators

Set this API environment variable in Render. It is a comma-separated allow-list of the email addresses permitted to use `/admin`.

```text
PLATFORM_ADMIN_EMAILS=owner@example.com,operations@example.com
```

Each listed email must already exist as a Supabase Auth user. It may also be an existing clinic administrator account. The platform allow-list adds platform access without removing that clinic access.

Do not expose this variable to the Vercel frontend and do not put it in Git.

## First Use

1. Set `PLATFORM_ADMIN_EMAILS` in Render and redeploy the API.
2. Sign in with that email at `/admin/login`.
3. Create a clinic from the Platform Dashboard with its clinic name, administrator email, and temporary password.
4. Give the clinic administrator the credentials. They sign in at `/clinic/login`.
5. The clinic pairs `Chair 1` from the existing device page and follows the existing Shelly setup guide.

## Security Model

The API, not the browser, checks platform access on every `/admin/*` request. The allow-list is read only on the backend. Clinic provisioning rolls back its clinic and Auth user if setup fails before completion.
