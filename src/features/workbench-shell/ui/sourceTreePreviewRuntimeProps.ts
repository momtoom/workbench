export const SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX =
  'wb-source-runtime-root-';

export function getSourceTreePreviewProjectComponentProps(
  runtimeNodeProps: Record<string, unknown>,
): Record<string, unknown> {
  const {
    draggable: _editorDraggable,
    onClick: _editorClick,
    onDoubleClick: _editorDoubleClick,
    onKeyDown: _editorKeyDown,
    onMouseDown: _editorMouseDown,
    onMouseDownCapture: _editorMouseDownCapture,
    onPointerDown: _editorPointerDown,
    onPointerDownCapture: _editorPointerDownCapture,
    ref: _editorInstrumentationRef,
    role: _editorRole,
    tabIndex: _editorTabIndex,
    ...projectComponentProps
  } = runtimeNodeProps;
  const nodeId = typeof projectComponentProps['data-wb-preview-node-id'] === 'string'
    ? projectComponentProps['data-wb-preview-node-id']
    : null;
  const runtimeRootClassName = nodeId
    ? getSourceTreePreviewRuntimeRootClassName(nodeId)
    : null;
  return runtimeRootClassName
    ? {
        ...projectComponentProps,
        className: mergeSourceTreePreviewRuntimeClassNames(
          projectComponentProps.className,
          runtimeRootClassName,
        ),
      }
    : projectComponentProps;
}

export function mergeSourceTreePreviewProjectComponentProps(
  componentProps: Record<string, unknown>,
  runtimeNodeProps: Record<string, unknown>,
): Record<string, unknown> {
  const mergedProps = {
    ...componentProps,
    ...runtimeNodeProps,
  };
  const className = mergeSourceTreePreviewRuntimeClassNames(
    componentProps.className,
    runtimeNodeProps.className,
  );
  if (className) mergedProps.className = className;
  else delete mergedProps.className;
  return mergedProps;
}

export function getSourceTreePreviewRuntimeRootClassName(nodeId: string): string {
  const encodedNodeId = Array.from(nodeId, (character) => (
    character.codePointAt(0)?.toString(16) ?? ''
  )).filter(Boolean).join('-');
  return encodedNodeId
    ? `${SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX}${encodedNodeId}`
    : SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX;
}

export function getSourceTreePreviewRuntimeRootNodeId(className: unknown): string | null {
  const normalizedClassName = typeof className === 'string'
    ? className
    : getSourceTreePreviewAnimatedClassName(className);
  if (!normalizedClassName) return null;
  const markerClassName = normalizedClassName.split(/\s+/).find((token) => (
    token.startsWith(SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX)
  ));
  if (!markerClassName) return null;
  const encodedNodeId = markerClassName.slice(
    SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX.length,
  );
  if (!encodedNodeId || !/^[0-9a-f]+(?:-[0-9a-f]+)*$/i.test(encodedNodeId)) return null;
  try {
    return encodedNodeId.split('-').map((segment) => {
      const codePoint = Number.parseInt(segment, 16);
      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        throw new Error('Invalid runtime root marker.');
      }
      return String.fromCodePoint(codePoint);
    }).join('');
  } catch {
    return null;
  }
}

function getSourceTreePreviewAnimatedClassName(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('baseVal' in value)) return null;
  return typeof value.baseVal === 'string' ? value.baseVal : null;
}

function mergeSourceTreePreviewRuntimeClassNames(
  left: unknown,
  right: unknown,
): string | undefined {
  const classNames = [left, right].flatMap((value) => (
    typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean) : []
  ));
  return classNames.length > 0
    ? Array.from(new Set(classNames)).join(' ')
    : undefined;
}

export function isSourceTreePreviewProjectRuntimeSourceChange(
  path: string,
  activeSourceFile: string | null | undefined,
): boolean {
  const changedPath = normalizeSourceTreePreviewRuntimePath(path);
  if (!changedPath) return false;
  // A dependency-tree change (reported when an install completes or package.json is
  // edited) can turn previously unresolvable imports resolvable, so every compiled
  // runtime module is stale even though no source file changed.
  if (changedPath === 'package.json' || changedPath === '.workbench/dependency-install.json') return true;
  if (!/\.(?:js|jsx|ts|tsx)$/.test(changedPath)) return false;
  if (changedPath.startsWith('.workbench/')) return false;
  if (changedPath.split('/').some((part) => part === 'node_modules' || part === 'dist' || part === 'build')) {
    return false;
  }

  const normalizedActiveSourceFile = normalizeSourceTreePreviewRuntimePath(activeSourceFile ?? '');
  return !normalizedActiveSourceFile || changedPath !== normalizedActiveSourceFile;
}

function normalizeSourceTreePreviewRuntimePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}
