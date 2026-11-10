# CSRLSC mobile app: API integration notes

Source of truth: the Swagger at `http://34.100.253.156/csrlsc-api/api-docs/` (spec: `/csrlsc-api/swagger.json`)
and the web client at `http://34.100.253.156/csrlsc/`. Where the two disagree this document says so.

## Setup

Create `.env.local` (git-ignored) and set:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | API root, default `http://34.100.253.156/csrlsc-api` |
| `EXPO_PUBLIC_AUTH_SECRET` | Shared AES key the web client uses to encrypt passwords and MPINs |

`EXPO_PUBLIC_*` values are compiled into the app bundle, exactly as they are in the web client. Treat the key as
obfuscation, not as a secret, and ask the backend team to move to a server-side scheme (or TLS-only) when possible.
The API is plain HTTP, so Android keeps `usesCleartextTraffic`; switch to HTTPS before any public release.

## Conventions

- Headers on every authenticated call: `Authorization: <token>` (no `Bearer`), `company: <defaultCompanyId>`,
  `role: <defaultRoleId>`, and `branch` only when the user has one. Built in `authenticated-headers.ts`.
- List responses: `{ status, message, data: { data: [], totalRecords, totalPages, currentPage } }`.
  Detail responses: `{ status, message, data: { data: {} } }`. Errors: `{ status: "error", message }`.
- Search bodies take `page`, `limit`, `sortBy`, `sortOrder`, `filters` and `include`. Passing `include` **replaces**
  the default nested data, so always list every relation you need. Filters accept dotted paths and operators,
  for example `"auditors.auditorId": id` or `"userCompany.userRole.role.roleName": { in: ["Audit"] }`.
- Timestamps are `YYYY-MM-DD HH:mm:ss` in UTC (`parseApiDate`). A date picked as local midnight is sent as an ISO string.
- A 401 clears the local session (`authenticated-request.ts`).

## Modules and endpoints

| Requirement | Endpoint(s) |
| --- | --- |
| 3.1 Login (password) | `POST /auth/login` `{ userId, password: <cipher>, iv, detail: true }` |
| 3.1 Login (MPIN) | `POST /auth/login` `{ userId, mpin, detail: true }` (MPIN is **not** encrypted at login) |
| 3.1 Logout | `POST /auth/logout` |
| 3.1 Forgot password | `POST /public/otpGenerate` then `/public/verify-otp` (returns `resetToken`) then `/public/forgot-password` |
| 3.1 MPIN | `POST /user/set-mpin`, `POST /user/change-mpin` (encrypted values plus IVs) |
| Change password | `POST /user/change-password` (encrypted old and new values plus IVs) |
| 3.2 Dashboard counts | `POST /assessment/search-assessment` with `limit: 1` and a status filter; read `totalRecords` |
| 3.2 Top / Bottom LSP | **No endpoint.** Computed in `features/dashboard/domain/lsp-ranking.ts` |
| 3.3 List | `POST /assessment/search-assessment` |
| 3.3 View | `POST /assessment/details-assessment/{id}` |
| 3.3 Create | `POST /assessment/add-assessment` (dropdown sources in `lookup.repository.ts`) |
| 3.3 Assign | `PUT /assessment/assign-auditor/{id}` `{ auditorIds, remarks }` |
| 3.4 Assess | `PUT /assessment/audit-parameters/{id}` |
| 3.5 Incidents | **No endpoint.** Swagger (1,012 paths) and the web app (`/csrlsc/`) have no incident list or create API; only the unrelated DEPS claims module has "incidents" linked to a consignment note, and Support Ticket is out of scope. The screens are UI only and store nothing: the list is always empty and Submit shows "Not implemented yet". |

Create-form lookups: services `/service/search-service`, sub services `/subService/search-subService`
(`filters.serviceMasterId`), domain, material group and geo type from `/quick/search-generalCode`
(`filters.codeType` = `DomainType`, `MaterialGroup`, `Geo`), companies `/shipper/search-shipper`, geo names from
`/country`, `/state`, `/city`, `/shipPoint` search, auditors `/user/search-user` (role "Audit"), and parameters
`/mainParameter/search-mainParameter` filtered by service, sub service and domain.

## Where the web client and the Swagger disagree (the app follows the web)

| Call | Swagger | Web client |
| --- | --- | --- |
| `audit-parameters` | bare array of `{ id, rating, answer, document, remarks, status }` | `{ parameters: [{ id, question, answer, rating, ratingRemarks, document }] }`; with files it is multipart (`data`, `parameters`, `files`, `filesMeta` with `documentType: "AuditDocument"`) |
| `add-assessment` | `demandedBy`, `assesmentOf`, `domains`, `geoType`, `materialId`, `locationId` | `demandedById`, `assesmentOfId`, `domainId`, `geoTypeId`, `geoName`, `materialGroupId`, ISO `toBeCompletedBy`, `parameter[]` |

## Mobile menu tree

The login token carries `platform: MOBILE`, and the server then returns a **mobile-specific** `roleComponent` tree that
contains none of the CSRLSC components (the web tree does). Gating on component names alone therefore hid Create,
Assign and the drawer entries on real devices. `mobile-modules.ts` now falls back to `session.user.isAdmin` for write
access, and shows the Assessment/Assess modules when their component is absent from the tree. If the backend later
adds those components to the mobile menu, the permissions in the tree take over automatically.

## Status model

Assessment status is set by the server: `Pending` (no auditor) then `Assigned` then `Completed` (every parameter audited).
Parameters are `Pending` or `Audited`. The "Started / Completed / Hold" buttons and a separate completion percentage
from the requirement document do not exist in the API. "% completed" is audited / total parameters. Ratings are whole
numbers 1 to 10; a rating is required only for mandatory parameters. Multiple-choice answers are joined with `", "`.

## Not yet verified against the server (writes were not exercised)

- Create, assign, audit save (JSON and multipart), set/change MPIN, change password and the forgot-password flow.
- The audit save sends only the parameters the auditor touched. Confirm the server treats omitted parameters as unchanged.
- Voice notes upload as `audio/mp4` (`.m4a`) through the audit call; confirm the server accepts that type.
- `auth/logout-session-by-token` (used by the web when the session cap is reached) is not in the Swagger, so the app
  only shows the server's message in that case.
- Incident types and sub types in `incident-options.ts` are placeholders.
- No user holds the "Audit" role in the current environment, so the auditor picker is empty until one is created.

## Native rebuild

`app.json` now uses package `com.csrlsc.mobile` and scheme `csrlsc`. The ignored `android/` folder still has the old
identity, so regenerate it with `npx expo prebuild --clean` before building. Icons come from `assets/branding/*.svg`
via `generate-pngs.js` (needs `npm install --no-save sharp`).

## Profile photo

| Call | Notes |
|---|---|
| `PUT /user/upload/{userId}` | `multipart/form-data`, one field `file` (image). Returns `{ data: { gcsPath, signedUrl, publicUrl } }`. |
| `GET /user/signed-url?path=<profilePic>` | Returns `{ data: { signedUrl } }`. |
| Login `userData.profilePic` | Stored path, `null` until a photo is uploaded, e.g. `/uploads/Test/1001/Users/<name>.png`. |

On this server `signedUrl` is a server-relative path, and the image is served at `API_BASE_URL + path` (200, `image/png`, no auth needed). A full `http(s)` link, as cloud storage would give, is used as is. There is no delete or reset call. Tested once with the CSRLSC logo on `admin@csrlsc.com`.
