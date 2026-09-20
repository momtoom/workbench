export type PageSourceFramework = 'react' | 'vue';

export const DEFAULT_PAGE_SOURCE_FRAMEWORK: PageSourceFramework = 'react';

export function getPageSourceFrameworkForFile(sourceFile: string): PageSourceFramework {
  return sourceFile.trim().toLowerCase().endsWith('.vue') ? 'vue' : 'react';
}
