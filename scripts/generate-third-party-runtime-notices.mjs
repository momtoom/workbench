import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const tailwindPackage = JSON.parse(readFileSync(path.join(root, 'node_modules/tailwindcss/package.json'), 'utf8'));
const tailwindLicense = readFileSync(path.join(root, 'node_modules/tailwindcss/LICENSE'), 'utf8').trim();

const notices = `# Workbench Runtime and External Asset Notices

This file covers generated starter CSS and remote assets
that are outside the production Node package list.

TL;DR lines are informal reading aids only. The license text and upstream terms control.


## Tailwind CSS package ${tailwindPackage.version}

TL;DR (informal): Tailwind CSS is MIT licensed. Its generated starter CSS also retains
the Tailwind MIT banner and the generator version used for that file.

${tailwindLicense}

## Remotely loaded fonts and sample media

TL;DR (informal): These assets are referenced from their providers at runtime and are
not copied into the Workbench distribution. Their upstream licenses and service terms
still control their use.

- Google Fonts used by the Astryx starter: Albert Sans, Crimson Text, DM Sans,
  Figtree, Fraunces, Fustat, JetBrains Mono, Manufacturing Consent, Montserrat,
  Outfit, PT Serif, Playwrite US Trad, Poppins, Sarina, and UnifrakturMaguntia.
  - https://fonts.google.com/
- Unsplash sample images used by starter component examples.
  - https://unsplash.com/license
- GitHub-hosted sample avatars referenced from \`github.com\`.

## External service scripts

TL;DR (informal): Hosted service SDKs are not bundled open-source packages. Their
provider terms apply when the related feature is enabled.

- Google Identity Services is loaded from \`https://accounts.google.com/gsi/client\`.
`;

writeFileSync(path.join(root, 'THIRD_PARTY_RUNTIME_NOTICES.md'), `${notices.trim()}\n`);
