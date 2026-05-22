# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 2.x (current) | ✅ |
| 1.x | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub issue.**

Email the details directly to: **aryanrajendrasuthar@gmail.com**

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any relevant file paths or endpoint names

You can expect an acknowledgement within 48 hours and a resolution timeline within 7 days for critical issues.

## Scope

In scope:
- Authentication bypass or token leakage
- SQL injection or RLS policy bypass in Supabase
- API endpoints returning data belonging to another user
- Secrets exposed in committed code or client-side bundles

Out of scope:
- Denial-of-service attacks
- Rate limiting thresholds
- Issues in third-party services (Supabase, Vercel, Render, Groq)
- Vulnerabilities requiring physical access to the device

## Security Architecture Notes

- `SUPABASE_SERVICE_ROLE_KEY` exists **only** in the backend runtime environment and is never sent to the browser. Supabase Row Level Security restricts all queries to the authenticated user's own data.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public. It cannot access other users' data because RLS policies are enforced at the database level.
- `GROQ_API_KEY` exists **only** in the backend runtime environment. AI endpoints require a valid Supabase JWT and are rate-limited.
- All API routes that return user data are protected by the `authGuard` middleware, which validates the Supabase JWT on every request.
