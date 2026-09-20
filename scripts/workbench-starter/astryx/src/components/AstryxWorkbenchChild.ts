import { isValidElement, type ElementType, type ReactElement, type ReactNode } from 'react';

const WORKBENCH_SOURCE_COMPONENT_NAME_ATTRIBUTE = 'data-wb-source-component-name';

export function isAstryxElementType(
  child: ReactNode,
  component: ElementType,
  ...names: string[]
): child is ReactElement<Record<string, unknown>> {
  if (!isValidElement(child)) return false;
  if (child.type === component) return true;

  const sourceName = getAstryxElementStringProp(child, WORKBENCH_SOURCE_COMPONENT_NAME_ATTRIBUTE);
  if (sourceName && names.includes(sourceName)) return true;

  const typeName = getAstryxElementTypeName(child.type);
  return Boolean(typeName && names.includes(typeName));
}

function getAstryxElementStringProp(
  child: ReactElement<unknown>,
  propName: string,
): string | null {
  const props = child.props as Record<string, unknown>;
  const value = props[propName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getAstryxElementTypeName(type: ReactElement['type']): string | null {
  if (typeof type === 'function') {
    return getAstryxFunctionName(type);
  }

  if (typeof type === 'object' && type !== null) {
    const record = type as { displayName?: unknown; name?: unknown; type?: unknown };
    if (typeof record.displayName === 'string') return record.displayName;
    if (typeof record.name === 'string') return record.name;
    if (typeof record.type === 'function') return getAstryxFunctionName(record.type);
  }

  return null;
}

function getAstryxFunctionName(fn: Function): string | null {
  const record = fn as { displayName?: unknown; name?: unknown };
  if (typeof record.displayName === 'string') return record.displayName;
  if (typeof record.name === 'string') return record.name;
  return null;
}
