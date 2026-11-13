# Security Specification — Luciana Domingos Imóveis

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false;`).
2. **PII Isolation (`leads`)**: Leads contain client PII (`name`, `whatsapp`, `email`). Public visitors may ONLY `create` a new lead with `status == 'Novo'` and valid bounded fields; `get`, `list`, `update`, and `delete` on `/leads/{leadId}` are strictly restricted to verified `isAdmin()`.
3. **Draft Protection (`landing_pages`)**: Public visitors may ONLY read `landing_pages` where `resource.data.status == 'published'`. Draft landing pages (`status == 'draft'`) are strictly readable only by `isAdmin()`.
4. **Moderation Gate (`testimonials`)**: Public visitors may ONLY read `testimonials` where `resource.data.approved == true`.
5. **Relational Integrity (`landing_pages`)**: Creating a landing page requires verifying via `exists()` that the referenced `developmentId` exists in `/developments/{developmentId}`.
6. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against `request.time`, and `createdAt` is immutable on update.
7. **Admin Privilege Protection (`/admins/{adminId}`)**: Only verified admins can read/write `/admins`; no user can self-elevate their own role.
8. **Strict Key & Size Guards**: Every document enforces `hasAll` and `hasOnly` on create, `affectedKeys().hasOnly(...)` on update, and `.size()` caps on every string and array.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Lead Scraping**: `LIST /leads` without admin auth -> `PERMISSION_DENIED`.
2. **Non-Admin Lead Read**: `GET /leads/lead_1` signed in as random user -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Lead**: `CREATE /leads/lead_x` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
4. **Pre-approved Lead Status Bypass**: `CREATE /leads/lead_x` with `status: 'Convertido'` as public visitor -> `PERMISSION_DENIED`.
5. **ID Poisoning**: `CREATE /leads/<1500-char string>` -> `PERMISSION_DENIED`.
6. **Draft Landing Page Leak**: `GET /landing_pages/lp_draft` where `status == 'draft'` as unauthenticated visitor -> `PERMISSION_DENIED`.
7. **Orphan Landing Page**: `CREATE /landing_pages/lp_orphan` with nonexistent `developmentId` -> `PERMISSION_DENIED`.
8. **Unverified Admin Email Spoof**: Request where `email == 'jessicaq2204@gmail.com'` and `email_verified == false` -> `PERMISSION_DENIED`.
9. **Self-Role Escalation**: `CREATE /admins/user_123` as regular signed-in user -> `PERMISSION_DENIED`.
10. **Denial-of-Wallet String Bomb**: `CREATE /leads/lead_bomb` with 100KB `message` -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: `CREATE /leads/lead_time` with backdated `createdAt` != `request.time` -> `PERMISSION_DENIED`.
12. **Immutable Field Mutation**: `UPDATE /properties/prop_1` attempting to mutate `createdAt` -> `PERMISSION_DENIED`.
