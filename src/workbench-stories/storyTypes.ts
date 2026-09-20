import type { ReactNode } from 'react';
import type { WorkbenchStoryArgs, WorkbenchStoryArgValue } from '@domain/project/workbenchStoryArgs';

export type { WorkbenchStoryArgs, WorkbenchStoryArgValue } from '@domain/project/workbenchStoryArgs';
export type WorkbenchStorySelectOption = number | string;

export type WorkbenchStoryControlCondition = {
  key: string;
  value: WorkbenchStoryArgValue | WorkbenchStoryArgValue[];
};

type WorkbenchStoryControlBase = {
  assetKinds?: WorkbenchStoryControlAssetKind[];
  /**
   * What the prop does, from the story's `argTypes[key].description`
   * (the Storybook field). The Inspector shows it on the prop label so a
   * designer reads the component's own doc instead of guessing from a name.
   */
  description?: string;
  groupId?: string;
  groupLabel?: string;
  groupOrder?: number;
  key: string;
  label: string;
  multiline?: boolean;
  order?: number;
  picker?: WorkbenchStoryControlPicker;
  tokenTypes?: WorkbenchStoryControlTokenType[];
  when?: WorkbenchStoryControlCondition;
  whenAll?: WorkbenchStoryControlCondition[];
};

export type WorkbenchStoryControlAssetKind = 'font' | 'icon' | 'image' | 'video';
export type WorkbenchStoryControlPicker = 'asset' | 'asset-token' | 'auto' | 'none' | 'token';
export type WorkbenchStoryControlTokenType = 'angle' | 'boolean' | 'color' | 'dimension' | 'duration' | 'gradient' | 'number' | 'opacity' | 'string';

export type WorkbenchStoryControl =
  | (WorkbenchStoryControlBase & { options: WorkbenchStorySelectOption[]; type: 'select' })
  | (WorkbenchStoryControlBase & { type: 'boolean' })
  | (WorkbenchStoryControlBase & { type: 'icon' })
  | (WorkbenchStoryControlBase & { leading?: string; max?: number; min?: number; scrubStep?: number; step?: number; type: 'number' })
  | (WorkbenchStoryControlBase & { suggestions?: string[]; type: 'text' });

export function isWorkbenchStorySelectOption(value: unknown): value is WorkbenchStorySelectOption {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

export type WorkbenchStorySourceInsertImport = {
  importSource?: string;
  names: string[];
  sourceFile?: string;
};

export type WorkbenchStorySourceInsert = {
  componentName?: string;
  imports?: WorkbenchStorySourceInsertImport[];
  jsxChildren?: string;
  jsxProps?: Record<string, string>;
  props?: Record<string, WorkbenchStoryArgValue>;
  sourceFile?: string;
};

export type WorkbenchStoryAuthoringRuntimeClass = 'canvas' | 'chart' | 'editor' | 'map' | 'virtualized-grid' | 'webgl';

export type WorkbenchStoryAuthoringContract = {
  /**
   * Components this parent accepts as direct children. Declaring it makes the
   * Design canvas "Add child" picker offer exactly these, instead of every
   * registered component that fits a block slot.
   */
  allowedChildren?: string[];
  capabilities?: string[];
  /**
   * Picker category for this component, e.g. `Inputs` or `Navigation`.
   * Without it a component falls back to its component set, which collapses
   * a whole library into one undifferentiated group.
   */
  group?: string;
  /**
   * Keep a compound sub-part out of root insert pickers. Overrides the
   * story-export-name heuristic in both directions.
   */
  hiddenFromInsert?: boolean;
  nativeReplacements?: string[];
  priority?: number;
  roles: string[];
  runtimeClass?: WorkbenchStoryAuthoringRuntimeClass;
};

export type WorkbenchStory = {
  authoring?: WorkbenchStoryAuthoringContract;
  componentId: string;
  controls: WorkbenchStoryControl[];
  defaultArgs: WorkbenchStoryArgs;
  designControls?: WorkbenchStoryControl[];
  designDefaultArgs?: WorkbenchStoryArgs;
  description: string;
  name: string;
  previewExportName?: string;
  previewSourceFile?: string;
  render: (args: WorkbenchStoryArgs) => ReactNode;
  sourceInsert?: WorkbenchStorySourceInsert;
  variants: Array<{ args: WorkbenchStoryArgs; id: string; name: string }>;
};

export type WorkbenchStoryMetadata = Omit<WorkbenchStory, 'render'> & {
  componentName?: string;
  sourceFile?: string;
};

export function getWorkbenchStoryControlValue(
  propName: string,
  sourceProps: WorkbenchStoryArgs,
  defaultArgs: WorkbenchStoryArgs,
): WorkbenchStoryArgValue {
  return sourceProps[propName] ?? defaultArgs[propName] ?? '';
}

export function isWorkbenchStoryControlVisible(
  control: WorkbenchStoryControl,
  sourceProps: WorkbenchStoryArgs,
  defaultArgs: WorkbenchStoryArgs,
): boolean {
  const conditions = [
    ...(control.when ? [control.when] : []),
    ...(control.whenAll ?? []),
  ];
  if (conditions.length === 0) return true;
  return conditions.every((condition) => isWorkbenchStoryControlConditionMet(condition, sourceProps, defaultArgs));
}

function isWorkbenchStoryControlConditionMet(
  condition: WorkbenchStoryControlCondition,
  sourceProps: WorkbenchStoryArgs,
  defaultArgs: WorkbenchStoryArgs,
): boolean {
  const currentValue = getWorkbenchStoryControlValue(condition.key, sourceProps, defaultArgs);
  const expectedValues = Array.isArray(condition.value) ? condition.value : [condition.value];
  return expectedValues.includes(currentValue);
}

export function getWorkbenchStoryDesignControls(story: WorkbenchStory): WorkbenchStoryControl[] {
  return story.designControls ?? story.controls;
}

export function getWorkbenchStoryDesignDefaultArgs(story: WorkbenchStory): WorkbenchStoryArgs {
  return story.designDefaultArgs ?? story.defaultArgs;
}
