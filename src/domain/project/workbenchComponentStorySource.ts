export type WorkbenchCsfStorySource = { path: string };

export function getWorkbenchCsfStoryNameAliases({
  componentName,
  displayName,
}: {
  componentName: string;
  displayName?: string | null;
}): string[] {
  const prefixStripMatch = /^([A-Z][a-z]+)([A-Z][a-zA-Z0-9]+)$/.exec(componentName);
  const exportDisplayName = prefixStripMatch ? prefixStripMatch[2] : componentName;
  return [...new Set([displayName, exportDisplayName, componentName].filter(
    (name): name is string => typeof name === 'string' && name.length > 0,
  ))];
}

export function findCsfStoryForComponent({
  componentName,
  displayName,
  sourceFile,
  stories,
}: {
  componentName: string;
  displayName: string;
  sourceFile: string;
  stories: WorkbenchCsfStorySource[];
}): WorkbenchCsfStorySource | null {
  const sourceDirectory = sourceFile.slice(0, Math.max(0, sourceFile.lastIndexOf('/') + 1));
  const preferredNames = getWorkbenchCsfStoryNameAliases({ componentName, displayName });
  const isVueComponentSource = /\.vue$/i.test(sourceFile);
  const preferredPaths = preferredNames.flatMap((name) => (isVueComponentSource
    ? [
      // Vue SFC components pair with JSX-free story modules.
      `${sourceDirectory}${name}.stories.ts`,
      `${sourceDirectory}${name}.story.ts`,
    ]
    : [
      `${sourceDirectory}${name}.stories.tsx`,
      `${sourceDirectory}${name}.stories.jsx`,
      `${sourceDirectory}${name}.story.tsx`,
      `${sourceDirectory}${name}.story.jsx`,
    ])).map((path) => path.toLowerCase());
  const storiesByPath = new Map(stories.map((story) => [story.path.toLowerCase(), story]));
  for (const preferredPath of preferredPaths) {
    const preferred = storiesByPath.get(preferredPath);
    if (preferred) return preferred;
  }
  const expected = isVueComponentSource
    ? sourceFile.replace(/\.vue$/i, '.stories.ts').toLowerCase()
    : sourceFile.replace(/\.(tsx|jsx)$/i, '.stories.$1').toLowerCase();
  const expectedSingular = isVueComponentSource
    ? sourceFile.replace(/\.vue$/i, '.story.ts').toLowerCase()
    : sourceFile.replace(/\.(tsx|jsx)$/i, '.story.$1').toLowerCase();
  return stories.find((story) => {
    const normalized = story.path.toLowerCase();
    return normalized === expected || normalized === expectedSingular;
  }) ?? null;
}
