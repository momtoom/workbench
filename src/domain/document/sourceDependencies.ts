import { resolveProjectLocalImportSourcePath } from './sourceImportRouting';

export type WorkbenchSourceDependencyFile = {
  contents: string;
  relativePath: string;
};

const STATIC_MODULE_SPECIFIER_PATTERN = /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?(['"])([^'"]+)\1\s*;?/g;
const DYNAMIC_MODULE_SPECIFIER_PATTERN = /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g;

export function findWorkbenchSourceFileDependents(
  files: WorkbenchSourceDependencyFile[],
  targetSourceFile: string,
): string[] {
  const targetIdentity = normalizeModuleIdentity(targetSourceFile);
  if (!targetIdentity) return [];

  return files
    .filter((file) => normalizeModuleIdentity(file.relativePath) !== targetIdentity)
    .filter((file) => collectModuleSpecifiers(file.contents).some((importSource) => {
      const resolvedSourceFile = resolveProjectLocalImportSourcePath(file.relativePath, importSource);
      return normalizeModuleIdentity(resolvedSourceFile ?? '') === targetIdentity;
    }))
    .map((file) => file.relativePath)
    .sort((left, right) => left.localeCompare(right));
}

function collectModuleSpecifiers(contents: string): string[] {
  const sources = new Set<string>();
  for (const pattern of [STATIC_MODULE_SPECIFIER_PATTERN, DYNAMIC_MODULE_SPECIFIER_PATTERN]) {
    pattern.lastIndex = 0;
    for (const match of contents.matchAll(pattern)) {
      const importSource = match[2]?.trim();
      if (importSource) sources.add(importSource);
    }
  }
  return [...sources];
}

function normalizeModuleIdentity(sourceFile: string): string {
  return sourceFile
    .trim()
    .replace(/\\/g, '/')
    .replace(/[?#].*$/, '')
    .replace(/\.(?:tsx?|jsx?)$/i, '')
    .replace(/\/index$/i, '');
}
