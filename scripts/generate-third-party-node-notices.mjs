import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageLock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const outputPath = path.join(root, 'THIRD_PARTY_NODE_MODULE_NOTICES.md');
const notices = new Map();

for (const [relativePackagePath, lockEntry] of Object.entries(packageLock.packages ?? {})) {
  if (!relativePackagePath || lockEntry?.dev === true || !relativePackagePath.includes('node_modules/')) continue;

  const packageRoot = path.join(root, relativePackagePath);
  const packageJsonPath = path.join(packageRoot, 'package.json');
  if (!existsSync(packageJsonPath)) continue;

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch {
    continue;
  }

  const name = packageJson.name ?? getPackageNameFromPath(relativePackagePath);
  const version = packageJson.version ?? lockEntry?.version ?? 'unknown';
  const key = `${name}@${version}`;
  if (notices.has(key)) continue;

  const legalFiles = readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^(?:licen[cs]e|copying|notice)(?:\.|$)/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => getLegalFilePriority(left) - getLegalFilePriority(right) || left.localeCompare(right));

  notices.set(key, {
    homepage: getPackageHomepage(packageJson),
    legalFiles: legalFiles.map((fileName) => ({
      fileName,
      text: normalizeLegalText(readFileSync(path.join(packageRoot, fileName), 'utf8')),
    })),
    license: formatLicense(packageJson.license ?? packageJson.licenses ?? lockEntry?.license),
    name,
    version,
  });
}

const lines = [
  '# Workbench Node Module Notices',
  '',
  'This generated file lists production Node packages resolved by the Workbench lockfile.',
  'Development-only packages are excluded. License and notice texts are copied from each',
  'installed package when the package publishes them.',
  'TL;DR lines are informal reading aids only; the license and notice text controls.',
  '',
];

const sortedNotices = [...notices.values()].sort(compareNotices);

for (const notice of sortedNotices) {
  lines.push(`## ${notice.name} ${notice.version}`, '');
  lines.push(`TL;DR (informal): ${summarizeLicense(notice.license)}`, '');
  lines.push(`Declared license: ${notice.license || 'Not declared'}`, '');
  if (notice.homepage) lines.push(`Source: ${notice.homepage}`, '');

  if (notice.legalFiles.length === 0) {
    lines.push('No standalone license or notice file was published in the installed package.', '');
    continue;
  }

  for (const legalFile of notice.legalFiles) {
    lines.push(`### ${legalFile.fileName}`, '', legalFile.text, '');
  }
}

writeFileSync(outputPath, `${lines.join('\n').trim()}\n`);
console.log(`Generated third-party notices for ${notices.size} production packages.`);

function compareNotices(left, right) {
  return left.name.localeCompare(right.name) || left.version.localeCompare(right.version);
}

function formatLicense(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatLicense).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return value.type ?? value.name ?? JSON.stringify(value);
  return '';
}

function getLegalFilePriority(fileName) {
  if (/^licen[cs]e/i.test(fileName)) return 0;
  if (/^copying/i.test(fileName)) return 1;
  return 2;
}

function getPackageHomepage(packageJson) {
  if (typeof packageJson.homepage === 'string') return packageJson.homepage;
  if (typeof packageJson.repository === 'string') return packageJson.repository;
  if (packageJson.repository && typeof packageJson.repository.url === 'string') {
    return packageJson.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
  }
  return '';
}

function summarizeLicense(license) {
  const normalized = license.toUpperCase();
  if (!normalized) return 'No license identifier was declared here; review the package source before redistribution.';
  if (normalized.includes('REMIX ICON')) {
    return 'Commercial product use is allowed, but standalone or competing icon-library distribution and logo use are restricted.';
  }
  if (normalized.includes('OFL')) {
    return 'The font may be embedded, bundled, and modified; do not sell it by itself, and keep it under the OFL.';
  }
  if (normalized.includes('AGPL')) {
    return 'Strong copyleft applies, including network use; review source-disclosure obligations before distribution or hosting.';
  }
  if (normalized.includes('LGPL')) {
    return 'Library use is allowed, with source and relinking obligations for distributed LGPL-covered modifications.';
  }
  if (/(^|[^L])GPL/.test(normalized)) {
    return 'Strong copyleft applies on distribution; review source-disclosure and same-license obligations.';
  }
  if (normalized.includes('MPL')) {
    return 'Commercial use is allowed; modifications to MPL-covered files must remain available under the MPL.';
  }
  if (normalized.includes('APACHE')) {
    return 'Commercial use, modification, and distribution are allowed; retain the license and notices. A patent grant is included.';
  }
  if (normalized.includes('CC-BY')) {
    return 'Reuse and modification are allowed with attribution; check any share-alike suffix before redistribution.';
  }
  if (normalized.includes('CC0') || normalized.includes('UNLICENSE') || normalized === '0BSD') {
    return 'Use, modification, and redistribution are broadly allowed with minimal or no attribution requirements.';
  }
  if (normalized.includes('MIT') || normalized.includes('ISC') || normalized.includes('BSD')) {
    return 'Commercial use, modification, and redistribution are allowed; retain the copyright and license notice.';
  }
  return `Review the ${license} terms below before redistribution; this license does not fit the common summaries.`;
}

function normalizeLegalText(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function getPackageNameFromPath(relativePackagePath) {
  const segments = relativePackagePath.split('node_modules/').at(-1)?.split('/').filter(Boolean) ?? [];
  return segments[0]?.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0] ?? relativePackagePath;
}
