# Local OpenWA Changes

This directory records production-specific changes, workarounds and
compatibility fixes used by the dmseclab OpenWA deployment.

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

## Historical Production Baseline

September 2026 compatibility implementation:

- Branch: production/whatsapp-compat-2026-09
- Commit: 01b67194bc14c198a8a98e39904c8b63c071467f
- Archive tag: archive/whatsapp-compat-2026-09

The branch and tag are retained for historical reference and rollback
analysis. They should not be merged into current main.

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

OpenWA 0.24.0 includes its own patch-wwebjs-media-id.js implementation
for the outgoing media model ID problem.

The local implementation must therefore not be reapplied unless future
testing demonstrates a different regression.


### LC-002 - Missing message ID after successful send

Status: REVIEW

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

OpenWA 0.24.0 contains significant whatsapp-web.js ID compatibility
patching and improved send error handling, but equivalence with this
specific defensive fallback has not yet been proven.

Action:

Test pristine OpenWA 0.24.0 first.

Only reintroduce this safeguard if testing reproduces the missing
message ID condition.


### LC-003 - Inbound media download mimetype

Status: UPSTREAM

Observed during October 2026 validation:

Error downloading media.

OpenWA 0.24.0 includes patch-wwebjs-download-mimetype.js, which passes
msg.mimetype to the whatsapp-web.js media download operation.

No local patch is required.

## Rule

Do not modify OpenWA source simply because a historical local patch exists.

Always test the current official upstream implementation first.
