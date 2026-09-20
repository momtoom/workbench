import type { WorkbenchStory } from './storyTypes';

const builtInStories: WorkbenchStory[] = [];

export function getWorkbenchStory(componentId: string): WorkbenchStory | null {
  return builtInStories.find((story) => story.componentId === componentId) ?? null;
}

export function getWorkbenchStories(): WorkbenchStory[] {
  return builtInStories;
}

export function getWorkbenchStoryBySourceName(sourceName: string): WorkbenchStory | null {
  return builtInStories.find((story) => story.name === sourceName || story.componentId === sourceName) ?? null;
}
