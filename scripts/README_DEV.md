Dev helper: add_points

Purpose

This script lets you add points to a user's `user_points` row using your Supabase service_role key. It's intended for local/dev testing only. It uses the Supabase REST API and requires the service role key (keep that secret).

How to use (PowerShell)

1) Export required env vars (PowerShell):

```powershell
$env:SUPABASE_URL = 'https://your-project.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'
```

2) Run the script providing the user's `user_id` (UUID from `auth.users`) and the amount of points to add:

```powershell
node scripts/add_points.js --user-id <USER_ID> --amount 10000
```

What it does

- If a `user_points` row for the given `user_id` exists, it increments `points` and `total_earned` by the given amount (atomic from the client's perspective — it's a single PATCH request using the service role key).
- If no `user_points` row exists, it creates one with `points` and `total_earned` set to the added amount.

Security notes

- DO NOT commit your service role key or paste it anywhere public.
- Run this script only on a trusted machine.
- This script is intentionally simple; for production or more secure flows, implement server-side endpoints and proper audit logging.

If you want, I can also:
- Create a safer server-side endpoint (Express or Netlify function) that accepts a one-time dev token instead of using the service role key on the client.
- Add a small admin UI button that calls such an endpoint (requires server-side infra).
