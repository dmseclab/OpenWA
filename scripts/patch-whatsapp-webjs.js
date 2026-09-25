'use strict';

const fs = require('fs');

const file =
  '/app/node_modules/whatsapp-web.js/src/util/Injected/Utils.js';

const expectedVersion = '1.34.7';
const installedVersion =
  require('/app/node_modules/whatsapp-web.js/package.json').version;

console.log(`whatsapp-web.js installed version: ${installedVersion}`);

if (installedVersion !== expectedVersion) {
  console.error(
    `PATCH ABORTED: expected whatsapp-web.js ${expectedVersion}, ` +
    `but found ${installedVersion}. Review compatibility patch before building.`
  );
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const marker =
  '// Compatibility fix: WhatsApp Web media data may expose __x_id';

if (source.includes(marker)) {
  console.log('Compatibility patch already present.');
  process.exit(0);
}

const needle = `            ...extraOptions,
        };

        // Bot's won't reply if canonicalUrl is set (linking)`;

const replacement = `            ...extraOptions,
        };

        // Compatibility fix: WhatsApp Web media data may expose __x_id
        // which conflicts with the outgoing message model ID.
        delete message.__x_id;

        // Bot's won't reply if canonicalUrl is set (linking)`;

if (!source.includes(needle)) {
  console.error(
    'PATCH ABORTED: expected whatsapp-web.js insertion point was not found.'
  );
  console.error(
    'The dependency may have changed. Review Utils.js before rebuilding.'
  );
  process.exit(1);
}

source = source.replace(needle, replacement);
fs.writeFileSync(file, source);

const verify = fs.readFileSync(file, 'utf8');

if (
  !verify.includes(marker) ||
  !verify.includes('delete message.__x_id;')
) {
  console.error('PATCH FAILED: verification failed.');
  process.exit(1);
}

console.log(
  'Compatibility patch applied successfully to whatsapp-web.js.'
);
