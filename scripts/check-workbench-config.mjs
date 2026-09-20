import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  WORKBENCH_APP_ID,
  WORKBENCH_DEFAULT_DEV_COMMAND,
} from './workbench-template.mjs';

const projectRoot = resolve(process.argv[2] ?? process.cwd());
const configPath = join(projectRoot, '.workbench', 'workbench.config.json');

if (!existsSync(configPath)) {
  console.error(`Missing Workbench config: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const errors = [];

if (config?.workbench?.app !== WORKBENCH_APP_ID) {
  errors.push(`workbench.app must be ${WORKBENCH_APP_ID}`);
}

if (config?.workbench?.devCommand !== WORKBENCH_DEFAULT_DEV_COMMAND) {
  errors.push(`workbench.devCommand must be ${WORKBENCH_DEFAULT_DEV_COMMAND}`);
}

if (Object.prototype.hasOwnProperty.call(config?.workbench ?? {}, 'previewUrl')) {
  errors.push('workbench.previewUrl should be omitted; Workbench resolves preview hosts at runtime');
}

if (config?.paths?.history !== '.workbench/history.json') {
  errors.push('paths.history must be .workbench/history.json');
}

if (config?.paths?.notes && config.paths.notes !== '.workbench/notes.json') {
  errors.push('paths.notes must be .workbench/notes.json');
}

if (config?.paths?.tokenCss && config.paths.tokenCss !== 'src/workbench-tokens.css') {
  errors.push('paths.tokenCss must be src/workbench-tokens.css');
}

if (errors.length > 0) {
  console.error('Workbench config check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Workbench config check passed.');
