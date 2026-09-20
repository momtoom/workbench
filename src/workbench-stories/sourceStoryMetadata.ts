import {
  isWorkbenchStorySelectOption,
  type WorkbenchStory,
  type WorkbenchStoryArgs,
  type WorkbenchStoryArgValue,
  type WorkbenchStoryControl,
  type WorkbenchStoryControlAssetKind,
  type WorkbenchStoryControlCondition,
  type WorkbenchStoryControlPicker,
  type WorkbenchStoryControlTokenType,
} from './storyTypes';
import {
  sortWorkbenchStoryArgs,
  sortWorkbenchStoryControls,
  sortWorkbenchStoryRecord,
  sortWorkbenchStorySourceInsert,
} from './storyPropOrder';
import { applyWorkbenchPropRegistry } from './propRegistry';
import { createValueTypeFallbackControl } from './storyControlFallbacks';
import { resolveWorkbenchRuntimeModuleUrl } from './runtimeModuleUrl';
import { normalizeProjectSourceFileReference } from '@domain/document/sourceImportRouting';
import { normalizeProjectSourcePath } from '@domain/document/sourceImportRouting';

export type WorkbenchStorySourceComponent = {
  id: string;
  name: string;
  sourceFile: string;
  extensions?: Record<string, unknown>;
};

const WORKBENCH_CSF_RUNTIME_DEPENDENCY_PATHS = new Set([
  '.workbench/dependency-install.json',
  'package.json',
]);

export function isWorkbenchCsfRuntimeDependencyChangePath(path: string): boolean {
  return WORKBENCH_CSF_RUNTIME_DEPENDENCY_PATHS.has(normalizeProjectSourcePath(path));
}

export function getComponentCsfStorySourceFile(component: WorkbenchStorySourceComponent): string | null {
  const configured = getStringExtension(component.extensions, 'storySourceFile');
  return configured && getStringExtension(component.extensions, 'storyFormat') === 'csf'
    ? configured
    : null;
}

export async function importWorkbenchCsfStoryMetadata(
  sourceFile: string,
  component: WorkbenchStorySourceComponent,
): Promise<WorkbenchStory | null> {
  const candidates = getStoryRuntimeImportCandidates(sourceFile);
  for (const candidate of candidates) {
    try {
      const moduleUrl = await resolveWorkbenchRuntimeModuleUrl(candidate, component.sourceFile);
      if (!moduleUrl) continue;
      const module = await import(/* @vite-ignore */ moduleUrl) as Record<string, unknown>;
      return createWorkbenchStoryMetadataFromCsfModule(module, component);
    } catch {
      // Try extension/index fallbacks.
    }
  }
  return null;
}

function createWorkbenchStoryMetadataFromCsfModule(
  module: Record<string, unknown>,
  component: WorkbenchStorySourceComponent,
): WorkbenchStory | null {
  const meta = isRecord(module.default) ? module.default : {};
  const storyEntries = getCsfStoryEntries(module);
  const primaryEntry = findPrimaryStoryEntryForComponent(storyEntries, component) ??
    storyEntries.find(([name]) => name === 'Default') ??
    storyEntries[0] ??
    null;
  if (!primaryEntry) return null;

  const [primaryExportName, primaryExport] = primaryEntry;
  const inheritMetaFields = shouldInheritCsfMetaFields(primaryExportName, primaryExport, component);
  const metaArgs = inheritMetaFields ? normalizeCsfArgs(meta.args) : {};
  const storyArgs = normalizeCsfArgs(isRecord(primaryExport) ? primaryExport.args : undefined);
  const defaultArgs = sortWorkbenchStoryArgs({ ...metaArgs, ...storyArgs });
  const storyArgTypes = isRecord(primaryExport) ? primaryExport.argTypes : undefined;
  const controls = sortWorkbenchStoryControls(applyWorkbenchPropRegistry(
    normalizeCsfControls(mergeCsfArgTypes(inheritMetaFields ? meta.argTypes : undefined, storyArgTypes), defaultArgs),
    component,
  ));
  const sourceInsert = sortWorkbenchStorySourceInsert(
    normalizeWorkbenchStorySourceInsertDefaults(
      resolveCsfSourceInsert(meta, primaryExport, inheritMetaFields),
      component,
    ),
  );
  const explicitDesignDefaultArgs = normalizeOptionalCsfArgs(
    isRecord(primaryExport) ? primaryExport.designDefaultArgs : undefined,
  ) ?? (inheritMetaFields ? normalizeOptionalCsfArgs(meta.designDefaultArgs) : undefined);
  const design = createDesignStoryContract(sourceInsert, controls, defaultArgs, component, explicitDesignDefaultArgs);
  const authoring = resolveCsfAuthoringContract(meta, primaryExport, inheritMetaFields);

  return {
    ...(authoring ? { authoring } : {}),
    componentId: component.id,
    controls,
    defaultArgs,
    ...(design ? design : {}),
    description: getTrimmedString(meta.description) ?? getTrimmedString(meta.title) ?? component.sourceFile,
    name: getTrimmedString(isRecord(primaryExport) ? primaryExport.name : undefined) ?? formatCsfStoryName(primaryExportName),
    render: () => null,
    ...(sourceInsert ? { sourceInsert } : {}),
    variants: createCsfStoryVariants(storyEntries, metaArgs, component, inheritMetaFields),
  };
}

function resolveCsfAuthoringContract(
  meta: Record<string, unknown>,
  primaryExport: unknown,
  inheritMetaFields: boolean,
): WorkbenchStory['authoring'] | undefined {
  const storyValue = isRecord(primaryExport) ? primaryExport.authoring : undefined;
  const value = storyValue ?? (inheritMetaFields ? meta.authoring : undefined);
  if (!isRecord(value)) return undefined;
  const roles = normalizeAuthoringStringList(value.roles);
  const allowedChildren = normalizeAuthoringStringList(value.allowedChildren);
  const capabilities = normalizeAuthoringStringList(value.capabilities);
  const nativeReplacements = normalizeAuthoringStringList(value.nativeReplacements);
  const hiddenFromInsert = typeof value.hiddenFromInsert === 'boolean' ? value.hiddenFromInsert : null;
  const runtimeClass = getTrimmedString(value.runtimeClass);
  // A story may declare only its insert contract. Requiring `roles` here used
  // to drop `allowedChildren` on the floor for every such story.
  if (roles.length === 0 && allowedChildren.length === 0 && hiddenFromInsert === null &&
    capabilities.length === 0 && nativeReplacements.length === 0 && !runtimeClass) return undefined;
  return {
    roles,
    ...(allowedChildren.length > 0 ? { allowedChildren } : {}),
    ...(hiddenFromInsert === null ? {} : { hiddenFromInsert }),
    ...(capabilities.length > 0 ? { capabilities } : {}),
    ...(nativeReplacements.length > 0 ? { nativeReplacements } : {}),
    ...(typeof value.priority === 'number' && Number.isFinite(value.priority) ? { priority: value.priority } : {}),
    ...(runtimeClass === 'canvas' || runtimeClass === 'chart' || runtimeClass === 'editor' || runtimeClass === 'map' || runtimeClass === 'virtualized-grid' || runtimeClass === 'webgl'
      ? { runtimeClass }
      : {}),
  };
}

function normalizeAuthoringStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => getTrimmedString(item)).filter((item): item is string => Boolean(item)))];
}

function createDesignStoryContract(
  sourceInsert: WorkbenchStory['sourceInsert'] | undefined,
  controls: WorkbenchStoryControl[],
  defaultArgs: WorkbenchStoryArgs,
  component: WorkbenchStorySourceComponent,
  explicitDesignDefaultArgs?: WorkbenchStoryArgs,
): Pick<WorkbenchStory, 'designControls' | 'designDefaultArgs'> | null {
  if (!sourceInsert) return null;
  const designArgs = sourceInsert.props ?? {};
  const exposeStoryControls = shouldExposeAllCsfControlsForDesign(component);
  const controlByKey = new Map(controls.map((control) => [control.key, control]));
  const sourceInsertControls = Object.keys(designArgs)
    .filter((key) => !isSourceStylePropKey(key))
    .map((key) => (
      controlByKey.get(key) ?? getFallbackControlsFromArgs({ [key]: designArgs[key] })[0]
    ))
    .filter((control): control is WorkbenchStoryControl => Boolean(control));
  const designControls = sortWorkbenchStoryControls(applyWorkbenchPropRegistry(
    mergeDesignStoryControls(exposeStoryControls ? controls : [], sourceInsertControls),
    component,
  ).filter((control) => !isSourceStylePropKey(control.key)));
  return {
    designControls,
    designDefaultArgs: explicitDesignDefaultArgs ?? sortWorkbenchStoryArgs(
      exposeStoryControls ? { ...normalizeWorkbenchStoryDesignDefaultArgs(defaultArgs, component), ...designArgs } : designArgs,
    ),
  };
}

function isSourceStylePropKey(key: string): boolean {
  return key === 'className';
}

function normalizeWorkbenchStoryDesignDefaultArgs(
  defaultArgs: WorkbenchStoryArgs,
  component: WorkbenchStorySourceComponent,
): WorkbenchStoryArgs {
  if (getTrimmedString(component.extensions?.sourcePreset) !== 'shadcn') return defaultArgs;
  return sortWorkbenchStoryArgs(Object.fromEntries(Object.entries(defaultArgs).map(([key, value]) => (
    typeof value === 'string'
      ? [key, getShadcnBaseNeutralText(component.name, key, value)]
      : [key, value]
  ))));
}

function shouldExposeAllCsfControlsForDesign(component: WorkbenchStorySourceComponent): boolean {
  // CSF meta args often describe a composed preview. Design editing should stay
  // scoped to sourceInsert.props unless a library explicitly opts into all args.
  return component.extensions?.designExposeStoryControls === true;
}

function mergeDesignStoryControls(
  primaryControls: WorkbenchStoryControl[],
  fallbackControls: WorkbenchStoryControl[],
): WorkbenchStoryControl[] {
  const controlsByKey = new Map<string, WorkbenchStoryControl>();
  for (const control of primaryControls) controlsByKey.set(control.key, control);
  for (const control of fallbackControls) {
    if (!controlsByKey.has(control.key)) controlsByKey.set(control.key, control);
  }
  return [...controlsByKey.values()];
}

function findPrimaryStoryEntryForComponent(
  storyEntries: Array<[string, unknown]>,
  component: WorkbenchStorySourceComponent,
): [string, unknown] | null {
  return storyEntries.find(([exportName, storyExport]) => (
    isCsfStoryEntryForComponent(exportName, storyExport, component)
  )) ?? null;
}

function getCsfStoryEntries(module: Record<string, unknown>): Array<[string, unknown]> {
  const order = Array.isArray(module.__namedExportsOrder)
    ? module.__namedExportsOrder.filter((name): name is string => typeof name === 'string')
    : [];
  const entries = Object.entries(module).filter(([name, value]) => (
    name !== 'default' &&
    name !== '__namedExportsOrder' &&
    /^[A-Z]/.test(name) &&
    (typeof value === 'function' || isRecord(value))
  ));
  return entries.sort(([left], [right]) => {
    const leftIndex = order.indexOf(left);
    const rightIndex = order.indexOf(right);
    if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    return 0;
  });
}

function mergeCsfArgTypes(metaArgTypes: unknown, storyArgTypes: unknown): unknown {
  if (!isRecord(metaArgTypes)) return storyArgTypes;
  if (!isRecord(storyArgTypes)) return metaArgTypes;
  return { ...metaArgTypes, ...storyArgTypes };
}

function createCsfStoryVariants(
  storyEntries: Array<[string, unknown]>,
  metaArgs: WorkbenchStoryArgs,
  component: WorkbenchStorySourceComponent,
  inheritMetaFields: boolean,
): WorkbenchStory['variants'] {
  const entries = inheritMetaFields
    ? storyEntries
    : storyEntries.filter(([exportName, storyExport]) => (
      isCsfStoryEntryForComponent(exportName, storyExport, component)
    ));

  return entries.map(([exportName, storyExport]) => ({
    args: sortWorkbenchStoryArgs({ ...metaArgs, ...normalizeCsfArgs(isRecord(storyExport) ? storyExport.args : undefined) }),
    id: exportName,
    name: getTrimmedString(isRecord(storyExport) ? storyExport.name : undefined) ?? formatCsfStoryName(exportName),
  }));
}

function isCsfStoryEntryForComponent(
  exportName: string,
  storyExport: unknown,
  component: WorkbenchStorySourceComponent,
): boolean {
  const candidates = getCsfComponentNameCandidates(component);
  if (candidates.has(exportName)) return true;

  const storyName = getTrimmedString(isRecord(storyExport) ? storyExport.name : undefined);
  if (storyName && candidates.has(storyName)) return true;

  return [...candidates].some((name) => exportName === `${name}Story`);
}

function shouldInheritCsfMetaFields(
  primaryExportName: string,
  primaryExport: unknown,
  component: WorkbenchStorySourceComponent,
): boolean {
  if (primaryExportName === 'Default') return true;
  const componentNames = getCsfComponentNameCandidates(component);
  if (componentNames.has(primaryExportName)) return true;

  const storyName = getTrimmedString(isRecord(primaryExport) ? primaryExport.name : undefined);
  const namesComponentStory = Boolean(
    (storyName && componentNames.has(storyName)) ||
      [...componentNames].some((name) => primaryExportName === `${name}Story`),
  );
  return !namesComponentStory;
}

function getCsfComponentNameCandidates(component: WorkbenchStorySourceComponent): Set<string> {
  return new Set([
    component.name,
    getTrimmedString(component.extensions?.importName),
    getTrimmedString(component.extensions?.sourceExportName),
  ].filter((value): value is string => Boolean(value)));
}

function resolveCsfSourceInsert(
  meta: Record<string, unknown>,
  primaryExport: unknown,
  inheritMetaFields: boolean,
): WorkbenchStory['sourceInsert'] | undefined {
  if (hasOwnCsfProperty(primaryExport, 'sourceInsert')) {
    return normalizeCsfSourceInsert(primaryExport.sourceInsert) ?? {};
  }
  return inheritMetaFields ? normalizeCsfSourceInsert(meta.sourceInsert) : undefined;
}

function hasOwnCsfProperty<T extends string>(
  value: unknown,
  key: T,
): value is Record<T, unknown> {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeCsfArgs(value: unknown): WorkbenchStoryArgs {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, argValue]): Array<[string, WorkbenchStoryArgValue]> => {
      if (typeof argValue === 'boolean' || typeof argValue === 'string') return [[key, argValue]];
      if (typeof argValue === 'number' && Number.isFinite(argValue)) return [[key, argValue]];
      return [];
    }),
  );
}

function normalizeOptionalCsfArgs(value: unknown): WorkbenchStoryArgs | undefined {
  return isRecord(value) ? sortWorkbenchStoryArgs(normalizeCsfArgs(value)) : undefined;
}

function normalizeCsfSourceInsert(value: unknown): WorkbenchStory['sourceInsert'] | undefined {
  if (!isRecord(value)) return undefined;
  const componentName = getTrimmedString(value.componentName) ?? undefined;
  const imports = normalizeCsfSourceInsertImports(value.imports);
  const jsxChildren = getTrimmedString(value.jsxChildren) ?? undefined;
  const jsxProps = normalizeStringRecord(value.jsxProps);
  const props = sortWorkbenchStoryArgs(normalizeCsfArgs(value.props));
  const sourceFile = getTrimmedString(value.sourceFile) ?? undefined;
  const sourceInsert = {
    ...(componentName ? { componentName } : {}),
    ...(imports ? { imports } : {}),
    ...(jsxChildren ? { jsxChildren } : {}),
    ...(jsxProps ? { jsxProps } : {}),
    ...(Object.keys(props).length > 0 ? { props } : {}),
    ...(sourceFile ? { sourceFile } : {}),
  };
  return Object.keys(sourceInsert).length > 0 ? sourceInsert : undefined;
}

function normalizeWorkbenchStorySourceInsertDefaults(
  sourceInsert: WorkbenchStory['sourceInsert'] | undefined,
  component: WorkbenchStorySourceComponent,
): WorkbenchStory['sourceInsert'] | undefined {
  if (!sourceInsert || getTrimmedString(component.extensions?.sourcePreset) !== 'shadcn') return sourceInsert;

  const componentName = getTrimmedString(component.extensions?.importName) ??
    getTrimmedString(component.extensions?.sourceExportName) ??
    component.name;
  const selectableValues = normalizeShadcnBaseSourceInsertSelectableValues(sourceInsert.jsxChildren);
  const props = normalizeShadcnBaseSourceInsertProps(componentName, sourceInsert.props, selectableValues.valueMap);
  const jsxProps = normalizeShadcnBaseSourceInsertJsxProps(sourceInsert.jsxProps, selectableValues.valueMap);
  const jsxChildren = selectableValues.jsxChildren
    ? normalizeShadcnBaseSourceInsertJsxChildren(selectableValues.jsxChildren, componentName)
    : undefined;

  return {
    ...sourceInsert,
    ...(jsxChildren ? { jsxChildren } : {}),
    ...(jsxProps ? { jsxProps } : {}),
    ...(props ? { props } : {}),
  };
}

function normalizeShadcnBaseSourceInsertProps(
  componentName: string,
  props: NonNullable<WorkbenchStory['sourceInsert']>['props'],
  valueMap: Map<string, string> = new Map(),
): NonNullable<WorkbenchStory['sourceInsert']>['props'] {
  if (!props) return props;
  const normalized = Object.fromEntries(Object.entries(props).map(([key, value]) => {
    if (typeof value !== 'string') return [key, value];
    const mappedValue = getShadcnBaseMappedSourceInsertValue(componentName, key, value, valueMap);
    if (mappedValue) return [key, mappedValue];
    return [key, getShadcnBaseNeutralText(componentName, key, value)];
  }));
  return sortWorkbenchStoryArgs(normalized);
}

const SHADCN_SOURCE_INSERT_SELECTABLE_VALUE_ELEMENTS = new Set([
  'AccordionItem',
  'AccordionPanel',
  'ComboboxItem',
  'ComboboxOption',
  'CommandItem',
  'CommandOption',
  'ContextMenuRadioItem',
  'DropdownMenuRadioItem',
  'MenubarRadioItem',
  'NativeSelectOption',
  'NavigationMenuItem',
  'NavigationMenuLinkItem',
  'NavigationMenuPanelItem',
  'RadioGroupItem',
  'RadioGroupOption',
  'SelectItem',
  'TabsContent',
  'TabsPane',
  'TabsTrigger',
  'ToggleGroupItem',
]);

function normalizeShadcnBaseSourceInsertSelectableValues(jsxChildren: string | undefined): {
  jsxChildren: string | undefined;
  valueMap: Map<string, string>;
} {
  const valueMap = new Map<string, string>();
  if (!jsxChildren) return { jsxChildren, valueMap };

  const usedValues = new Set<string>();
  for (const match of jsxChildren.matchAll(/\bvalue="([^"]+)"/g)) {
    const value = match[1]?.trim();
    if (value && /^item-\d+$/.test(value)) usedValues.add(value);
  }

  let nextIndex = 1;
  const getNextValue = () => {
    while (usedValues.has(`item-${nextIndex}`)) nextIndex += 1;
    const value = `item-${nextIndex}`;
    usedValues.add(value);
    nextIndex += 1;
    return value;
  };

  const normalizedJsxChildren = jsxChildren.replace(
    /<([A-Z][A-Za-z0-9_$]*)([^<>]*?\svalue=")([^"]+)(")/g,
    (match, elementName: string, beforeValue: string, value: string, afterValue: string) => {
      if (!SHADCN_SOURCE_INSERT_SELECTABLE_VALUE_ELEMENTS.has(elementName)) return match;
      const trimmedValue = value.trim();
      if (/^item-\d+$/.test(trimmedValue)) {
        valueMap.set(trimmedValue, trimmedValue);
        return match;
      }
      const normalizedValue = valueMap.get(trimmedValue) ?? getNextValue();
      valueMap.set(trimmedValue, normalizedValue);
      return `<${elementName}${beforeValue}${normalizedValue}${afterValue}`;
    },
  );

  return { jsxChildren: normalizedJsxChildren, valueMap };
}

function getShadcnBaseMappedSourceInsertValue(
  componentName: string,
  key: string,
  value: string,
  valueMap: Map<string, string>,
): string | null {
  const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (normalizedKey !== 'value' && normalizedKey !== 'defaultvalue') return null;

  const trimmedValue = value.trim();
  const mappedValue = valueMap.get(trimmedValue);
  if (mappedValue) return mappedValue;

  if (normalizedKey === 'value' && SHADCN_SOURCE_INSERT_SELECTABLE_VALUE_ELEMENTS.has(componentName)) {
    return /^item-\d+$/.test(trimmedValue) ? trimmedValue : 'item-1';
  }

  return null;
}

function normalizeShadcnBaseSourceInsertJsxProps(
  jsxProps: NonNullable<WorkbenchStory['sourceInsert']>['jsxProps'],
  valueMap: Map<string, string>,
): NonNullable<WorkbenchStory['sourceInsert']>['jsxProps'] {
  if (!jsxProps || valueMap.size === 0) return jsxProps;
  const normalized = Object.fromEntries(Object.entries(jsxProps).map(([key, value]) => {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (normalizedKey !== 'value' && normalizedKey !== 'defaultvalue') return [key, value];
    return [key, replaceQuotedShadcnSourceInsertValues(value, valueMap)];
  }));
  return sortWorkbenchStoryRecord(normalized);
}

function replaceQuotedShadcnSourceInsertValues(value: string, valueMap: Map<string, string>): string {
  let nextValue = value;
  for (const [from, to] of valueMap) {
    nextValue = nextValue.replace(
      new RegExp(`(["'])${escapeRegExp(from)}\\1`, 'g'),
      (match, quote) => `${quote}${to}${quote}`,
    );
  }
  return nextValue;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeShadcnBaseSourceInsertJsxChildren(jsxChildren: string, fallbackComponentName: string): string {
  return jsxChildren.replace(/>([^<>{}][^<>]*?)</g, (match, text, offset, source) => {
    if (typeof text !== 'string' || text.trim().length === 0) return match;
    const componentName = getSourceInsertElementNameBefore(source, offset) ?? fallbackComponentName;
    const nextText = getShadcnBaseNeutralText(componentName, 'children', text);
    return `>${nextText}<`;
  });
}

function getSourceInsertElementNameBefore(source: string, offset: number): string | null {
  const before = source.slice(0, offset);
  const matches = [...before.matchAll(/<([A-Z][A-Za-z0-9_$]*)(?:\s|>|\/)/g)];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const candidate = matches[index]?.[1];
    if (!candidate || candidate.startsWith('Ri')) continue;
    return candidate;
  }
  return null;
}

function getShadcnBaseNeutralText(componentName: string, key: string, value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return value;

  const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (normalizedKey === 'title') return 'Title';
  if (normalizedKey.endsWith('title')) return 'Title';
  if (normalizedKey === 'description') return 'Description';
  if (normalizedKey.endsWith('description')) return 'Description';
  if (normalizedKey === 'trigger') return 'Trigger';
  if (normalizedKey === 'label' || normalizedKey.endsWith('label')) return 'Label';
  if (normalizedKey === 'placeholder' || normalizedKey.endsWith('placeholder')) return 'Placeholder';
  if (normalizedKey === 'heading' || normalizedKey.endsWith('heading')) return 'Heading';
  if (normalizedKey === 'badge' || normalizedKey.endsWith('badge')) return 'Badge';
  if (normalizedKey === 'caption' || normalizedKey.endsWith('caption')) return 'Caption';
  if (normalizedKey === 'eyebrow' || normalizedKey.endsWith('eyebrow')) return 'Eyebrow';
  if (normalizedKey === 'body' || normalizedKey.endsWith('body')) return 'Body';
  if (normalizedKey === 'content' || normalizedKey.endsWith('content')) return 'Content';
  if (normalizedKey === 'text' || normalizedKey.endsWith('text')) return 'Text';
  if (normalizedKey !== 'children' && normalizedKey !== 'text') return value;
  if (isShadcnBaseStablePlaceholderText(trimmedValue)) return trimmedValue;

  if (componentName.endsWith('Title')) return 'Title';
  if (componentName.endsWith('Description')) return 'Description';
  if (componentName.endsWith('Label')) return 'Label';
  if (componentName.endsWith('Trigger')) return 'Trigger';
  if (componentName.endsWith('Content')) return 'Content';
  if (componentName.endsWith('Header')) return 'Header';
  if (componentName.endsWith('Footer')) return 'Footer';
  if (componentName.endsWith('Action')) return 'Action';
  if (componentName.endsWith('Cancel')) return 'Cancel';
  if (componentName.endsWith('Close')) return 'Close';
  if (componentName.endsWith('Shortcut')) return 'Shortcut';
  if (componentName.endsWith('Link')) return 'Link';
  if (componentName.endsWith('Page')) return 'Page';
  if (componentName.endsWith('Caption')) return 'Caption';
  if (componentName.endsWith('Empty')) return 'Empty';
  if (componentName.endsWith('Legend')) return 'Legend';
  if (componentName.endsWith('Error')) return 'Error';
  if (componentName.endsWith('Value')) return 'Value';
  if (componentName.endsWith('Head')) return 'Header';
  if (componentName.endsWith('Cell')) return 'Cell';
  if (componentName.endsWith('Option')) return 'Option';
  if (componentName.endsWith('Item')) return 'Item';
  if (componentName.endsWith('Addon')) return 'Addon';
  if (componentName.endsWith('Text')) return 'Text';
  if (componentName.endsWith('Media')) return 'Media';
  if (componentName.endsWith('Badge')) return 'Badge';
  if (componentName.endsWith('Count')) return 'Count';
  if (componentName.endsWith('Fallback')) return 'Fallback';
  if (componentName.endsWith('Separator')) return 'Separator';
  if (componentName.endsWith('Button')) return 'Button';
  if (componentName === 'Button') return 'Button';
  if (componentName === 'Badge') return 'Badge';
  if (componentName === 'Kbd') return 'Shortcut';
  if (componentName === 'Label') return 'Label';
  if (componentName === 'Toggle') return 'Toggle';
  if (componentName === 'Spinner') return 'Spinner';
  return 'Text';
}

function isShadcnBaseStablePlaceholderText(value: string): boolean {
  return value === 'No results found.' ||
    /^(?:Content|Item|Option|Page|Panel|Row|Slide|Step|Tab) \d+$/i.test(value);
}

function normalizeCsfSourceInsertImports(value: unknown): NonNullable<WorkbenchStory['sourceInsert']>['imports'] | undefined {
  if (!Array.isArray(value)) return undefined;
  const imports = value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const names = Array.isArray(item.names)
      ? dedupeStrings(item.names.filter((name): name is string => typeof name === 'string' && name.trim().length > 0))
      : [];
    if (names.length === 0) return [];
    const importSource = getTrimmedString(item.importSource) ?? undefined;
    const sourceFile = getTrimmedString(item.sourceFile) ?? undefined;
    return [{
      ...(importSource ? { importSource } : {}),
      names,
      ...(sourceFile ? { sourceFile } : {}),
    }];
  });
  return imports.length > 0 ? imports : undefined;
}

function normalizeStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).flatMap(([key, item]) => {
    const trimmedKey = key.trim();
    if (!trimmedKey || typeof item !== 'string' || item.trim().length === 0) return [];
    return [[trimmedKey, item.trim()] as const];
  });
  return entries.length > 0 ? sortWorkbenchStoryRecord(Object.fromEntries(entries)) : undefined;
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeCsfControls(argTypes: unknown, defaultArgs: WorkbenchStoryArgs): WorkbenchStoryControl[] {
  if (!isRecord(argTypes)) return getFallbackControlsFromArgs(defaultArgs);

  return Object.entries(argTypes).flatMap(([key, value]): WorkbenchStoryControl[] => {
    if (isSourceStylePropKey(key)) return [];
    const config = isRecord(value) ? value : {};
    const label = getTrimmedString(config.name) ?? formatCsfArgLabel(key);
    const description = getTrimmedString(config.description);
    const options = Array.isArray(config.options) ? config.options.filter(isWorkbenchStorySelectOption) : [];
    const suggestions = normalizeCsfControlSuggestions(config.suggestions);
    const control = isRecord(config.control) ? config.control : config.control;
    const controlType = typeof control === 'string'
      ? control
      : isRecord(control) && typeof control.type === 'string'
        ? control.type
        : null;
    const when = normalizeCsfControlCondition(config.when);
    const whenAll = normalizeCsfControlConditions(config.whenAll);
    const order = getFiniteNumber(config.order) ?? (isRecord(config.table) ? getFiniteNumber(config.table.order) : null) ?? undefined;
    const multiline = controlType === 'textarea' || config.multiline === true || (isRecord(control) && control.multiline === true);
    const base = {
      ...normalizeCsfControlGroupMetadata(config),
      ...(description ? { description } : {}),
      key,
      label,
      multiline: multiline || undefined,
      order,
      when,
      whenAll,
    };
    const bindingMetadata = normalizeCsfControlBindingMetadata(config);
    const textControl: WorkbenchStoryControl = {
      ...base,
      ...bindingMetadata,
      ...(suggestions ? { suggestions } : {}),
      type: 'text',
    };
    if (controlType === 'icon') return [{ ...base, ...bindingMetadata, type: 'icon' }];
    if (options.length > 0) return [{ ...base, options, type: 'select' }];
    if (controlType === 'text' && suggestions) return [textControl];
    if (controlType === 'select' || controlType === 'radio') return [];
    if (isIconLikeControlKey(key, defaultArgs[key])) return [{ ...base, ...bindingMetadata, type: 'icon' }];
    if (controlType === 'boolean' || typeof defaultArgs[key] === 'boolean') return [{ ...base, type: 'boolean' }];
    if (controlType === 'number' || controlType === 'range') {
      return [{
        ...base,
        max: getFiniteNumber(config.max) ?? (isRecord(control) ? getFiniteNumber(control.max) : undefined) ?? undefined,
        min: getFiniteNumber(config.min) ?? (isRecord(control) ? getFiniteNumber(control.min) : undefined) ?? undefined,
        scrubStep: getFiniteNumber(config.scrubStep) ?? (isRecord(control) ? getFiniteNumber(control.scrubStep) : undefined) ?? undefined,
        step: getFiniteNumber(config.step) ?? (isRecord(control) ? getFiniteNumber(control.step) : undefined) ?? undefined,
        type: 'number',
      }];
    }
    return [textControl];
  });
}

const validCsfControlAssetKinds: readonly WorkbenchStoryControlAssetKind[] = ['font', 'icon', 'image', 'video'];
const validCsfControlPickers: readonly WorkbenchStoryControlPicker[] = ['asset', 'asset-token', 'auto', 'none', 'token'];
const validCsfControlTokenTypes: readonly WorkbenchStoryControlTokenType[] = [
  'angle',
  'boolean',
  'color',
  'dimension',
  'duration',
  'gradient',
  'number',
  'opacity',
  'string',
];

function normalizeCsfControlGroupMetadata(config: Record<string, unknown>): Pick<
  WorkbenchStoryControl,
  'groupId' | 'groupLabel' | 'groupOrder'
> {
  const groupId = getTrimmedString(config.groupId);
  const groupLabel = getTrimmedString(config.groupLabel);
  const groupOrder = getFiniteNumber(config.groupOrder);
  return {
    ...(groupId ? { groupId } : {}),
    ...(groupLabel ? { groupLabel } : {}),
    ...(typeof groupOrder === 'number' ? { groupOrder } : {}),
  };
}

function normalizeCsfControlBindingMetadata(config: Record<string, unknown>): Pick<
  WorkbenchStoryControl,
  'assetKinds' | 'picker' | 'tokenTypes'
> {
  const assetKinds = normalizeCsfControlAssetKinds(config.assetKinds);
  const picker = normalizeCsfControlPicker(config.picker);
  const tokenTypes = normalizeCsfControlTokenTypes(config.tokenTypes);
  return {
    ...(assetKinds ? { assetKinds } : {}),
    ...(picker ? { picker } : {}),
    ...(tokenTypes ? { tokenTypes } : {}),
  };
}

function normalizeCsfControlAssetKinds(value: unknown): WorkbenchStoryControlAssetKind[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.filter((item): item is WorkbenchStoryControlAssetKind => (
    validCsfControlAssetKinds.includes(item as WorkbenchStoryControlAssetKind)
  ));
  return normalized.length > 0 ? [...new Set(normalized)] : undefined;
}

function normalizeCsfControlPicker(value: unknown): WorkbenchStoryControlPicker | undefined {
  const picker = getTrimmedString(value);
  return validCsfControlPickers.includes(picker as WorkbenchStoryControlPicker)
    ? (picker as WorkbenchStoryControlPicker)
    : undefined;
}

function normalizeCsfControlTokenTypes(value: unknown): WorkbenchStoryControlTokenType[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.filter((item): item is WorkbenchStoryControlTokenType => (
    validCsfControlTokenTypes.includes(item as WorkbenchStoryControlTokenType)
  ));
  return normalized.length > 0 ? [...new Set(normalized)] : undefined;
}

function normalizeCsfControlSuggestions(value: unknown): string[] | undefined {
  const suggestions = normalizeAuthoringStringList(value);
  return suggestions.length > 0 ? suggestions : undefined;
}

function normalizeCsfControlCondition(value: unknown): WorkbenchStoryControlCondition | undefined {
  if (!isRecord(value)) return undefined;
  const key = getTrimmedString(value.key);
  if (!key) return undefined;
  const values = Array.isArray(value.value) ? value.value : [value.value];
  const normalized = values.filter((item): item is WorkbenchStoryArgValue => (
    typeof item === 'string' ||
    typeof item === 'boolean' ||
    (typeof item === 'number' && Number.isFinite(item))
  ));
  if (normalized.length === 0) return undefined;
  return { key, value: normalized.length === 1 ? normalized[0]! : normalized };
}

function normalizeCsfControlConditions(value: unknown): WorkbenchStoryControlCondition[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const conditions = value
    .map(normalizeCsfControlCondition)
    .filter((condition): condition is WorkbenchStoryControlCondition => Boolean(condition));
  return conditions.length > 0 ? conditions : undefined;
}

export function getFallbackControlsFromArgs(args: WorkbenchStoryArgs): WorkbenchStoryControl[] {
  return sortWorkbenchStoryControls(Object.entries(sortWorkbenchStoryArgs(args))
    .filter(([key]) => !isSourceStylePropKey(key))
    .map(([key, value]) => (
    createValueTypeFallbackControl(key, value, formatCsfArgLabel(key)) ??
    (isIconLikeControlKey(key, value)
      ? { key, label: formatCsfArgLabel(key), type: 'icon' }
      : { key, label: formatCsfArgLabel(key), type: 'text' })
  )));
}

function isIconLikeControlKey(key: string, value: WorkbenchStoryArgs[string] | undefined): boolean {
  if (typeof value !== 'string') return false;
  const normalizedKey = key.replace(/[\s_-]+/g, '').toLowerCase();
  return normalizedKey === 'icon' || normalizedKey === 'iconname' || normalizedKey.endsWith('icon');
}

function getStoryRuntimeImportCandidates(sourceFile: string): string[] {
  const normalizedSourceFile = normalizeProjectSourceFileReference(sourceFile);
  if (/\.(?:tsx|ts|jsx|js|vue)$/.test(normalizedSourceFile)) return [normalizedSourceFile];
  return [
    `${normalizedSourceFile}.tsx`,
    `${normalizedSourceFile}.ts`,
    `${normalizedSourceFile}.jsx`,
    `${normalizedSourceFile}.js`,
    `${normalizedSourceFile}/index.tsx`,
    `${normalizedSourceFile}/index.ts`,
    `${normalizedSourceFile}/index.jsx`,
    `${normalizedSourceFile}/index.js`,
  ];
}

function formatCsfStoryName(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function formatCsfArgLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  const value = extensions?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
