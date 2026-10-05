# Local OpenWA Changes

This directory records production-specific changes, workarounds,
compatibility fixes and deployment requirements used by the dmseclab
OpenWA deployment.

## Maintenance Policy

The main branch should track the official rmyndharis/OpenWA main branch
as closely as possible.

Local source changes must only be introduced when required for production.

Every local change must record:

- the problem being addressed
- the reason for the change
- affected files
- the local Git commit
- upstream status
- validation performed
- whether the local change is ACTIVE, REVIEW or RETIRED

When upstream implements an equivalent fix, the local patch should be
removed and its record retained here as RETIRED.

Production-specific deployment configuration should preferably remain
outside the upstream source tree and be documented here where required.

## Historical Production Baseline

September 2026 compatibility implementation:

- Branch: production/whatsapp-compat-2026-09
- Commit: 01b67194bc14c198a8a98e39904c8b63c071467f
- Archive tag: archive/whatsapp-compat-2026-09

The branch and tag are retained for historical reference and rollback
analysis. They should not be merged into current main.

## Current Production Baseline

Validated on 5 October 2026:

- OpenWA version: 0.24.0
- Production image: openwa-api:production-0.24.0-20261005
- Image ID:
  sha256:baead019d10c3e010cf04f059542adc0e57b425ad22539794101d3695c7ef137
- Production Compose override: /root/openwa-production.yml
- Production environment: /root/openwa-production-20261002.env
- Persistent authentication survived full host reboot without QR re-pairing
- Docker and OpenWA recovered automatically after full host reboot
- Persisted WhatsApp session automatically returned to ready
- Post-reboot text delivery validated successfully
- Post-reboot image delivery validated successfully
- Successful sends returned genuine non-empty WhatsApp message IDs

The pre-upgrade rollback image and persistent-data backup are retained
separately from the current production deployment.

## Production Deployment Requirements

### Automatic session recovery

Production requires:

AUTO_START_SESSIONS=true

Without this setting, the API and databases recover after a restart but
persisted sessions are reset to disconnected and require a session start
request.

With AUTO_START_SESSIONS=true, testing confirmed the following unattended
recovery sequence:

Host reboot -> Docker startup -> OpenWA API startup -> persisted session
discovery -> engine initialization -> WhatsApp session ready

No manual /start request or QR re-pairing was required.

### Puppeteer browser

The historical production override:

PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

was removed during the OpenWA 0.24.0 migration.

Production now uses the browser supplied with the current OpenWA image:

/usr/local/bin/puppeteer-chrome

The validated image used Chrome for Testing 153.0.8010.36.

### Internal media source / SSRF protection

Production sends dashboard and SCADA images from the trusted internal
media host.

OpenWA SSRF protection remains enabled.

The trusted internal media host is explicitly allowed using:

SSRF_ALLOWED_HOSTS=172.18.8.115

Do not disable SSRF protection globally to permit internal image sends.

### WhatsApp Web version pinning

The configured pinned WhatsApp Web build did not match the build actually
loaded during validation.

This did not prevent successful session recovery, text sending or image
sending during the 0.24.0 production validation.

The version pinning behaviour remains a follow-up item and should not be
changed without a separate controlled test.

## Local Change Register

### LC-001 - Outgoing media private ID conflict

Status: RETIRED

Original symptom:

Image/media sends failed with an error similar to:

Data passed to getter must include an id property but got undefined.

Original local solution:

A build-time patch removed the media model private __x_id before
whatsapp-web.js constructed the outgoing message.

Original files:

- Dockerfile
- scripts/patch-whatsapp-webjs.js

Original commit:

01b67194bc14c198a8a98e39904c8b63c071467f

Upstream status:

OpenWA 0.24.0 includes patch-wwebjs-media-id.js for the outgoing media
model ID problem.

Validation:

Image sending was tested successfully before and after a full host reboot.
The API returned genuine non-empty message IDs and physical delivery was
confirmed.

No historical local patch is required.

The local implementation must not be reapplied unless a future upstream
regression is demonstrated.

### LC-002 - Missing message ID after successful send

Status: RETIRED

Original symptom:

A WhatsApp send could succeed but client.sendMessage() could return a
result without a usable msg.id. OpenWA then attempted to access
msg.id._serialized.

Original local solution:

sendTextMessage() and media sending returned a defensive result containing:

- an empty id
- the current timestamp

when msg.id was unavailable.

Original file:

- src/engine/adapters/whatsapp-web-js.adapter.ts

Original commit:

01b67194bc14c198a8a98e39904c8b63c071467f

Upstream status:

OpenWA 0.24.0 includes current whatsapp-web.js compatibility handling and
send error handling.

Validation:

Controlled text and image sends were successfully completed using pristine
OpenWA 0.24.0 without the historical defensive fallback.

Post-reboot validation returned genuine non-empty WhatsApp message IDs for
both text and image sends and physical delivery was confirmed.

No historical local fallback is currently required.

Only reconsider this change if a future regression reproduces the missing
message ID condition.

### LC-003 - Inbound media download mimetype

Status: UPSTREAM-COVERED

Historical symptom:

Error downloading media.

Upstream status:

OpenWA 0.24.0 includes patch-wwebjs-download-mimetype.js, which passes the
media mimetype to the whatsapp-web.js media download operation.

Production applicability:

The current production workflow is controlled outbound messaging.
Inbound-media validation was therefore not required for the production
migration.

No local patch is currently required.

## Validation Summary - 5 October 2026

OpenWA 0.24.0 passed the production migration validation:

- existing persisted authentication retained
- no QR re-pairing required
- container recreation passed
- full unattended host reboot passed
- Docker services recovered automatically
- API readiness returned HTTP 200
- main and data databases reported up
- AUTO_START_SESSIONS automatically initialized the persisted session
- session returned to ready with engineLoaded=true and lastError=null
- text sending returned HTTP 201 with a genuine message ID
- physical text delivery was confirmed
- image sending returned HTTP 201 with a genuine message ID
- physical image delivery was confirmed
- no media, send or SSRF errors were observed after the image test
- production image was promoted without changing the validated image ID

## Rule

Do not modify OpenWA source simply because a historical local patch exists.

Always test the current official upstream implementation first.

Production-specific configuration must be documented and preserved
separately without unnecessarily diverging the upstream source tree.
