import {
  Children,
  createElement,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type PointerEvent as ReactPointerEvent,
} from 'react';

const WORKBENCH_RUNTIME_CLASS_PATTERN = /\bwb-source-runtime-root-[^\s]+\b/g;

export function useStableAstryxChildren(children: ReactNode): ReactNode {
  const signature = getAstryxChildrenSignature(children);
  const stable = useRef({ children, signature });
  if (stable.current.signature !== signature) {
    stable.current = { children, signature };
  }
  return stable.current.children;
}

export function AstryxTypeaheadPointerBoundary({
  children,
  boundaryRef,
}: {
  children: ReactNode;
  boundaryRef?: Ref<HTMLSpanElement>;
}) {
  return createElement(
    'span',
    {
      ref: boundaryRef,
      'data-astryx-typeahead-pointer-boundary': 'true',
      onPointerDownCapture: (event: ReactPointerEvent<HTMLSpanElement>) => {
        const target = event.target as {
          closest?: (selector: string) => Element | null;
        } | null;
        if (target?.closest?.('[role="option"]')) {
          // Keep the combobox input focused until BaseTypeahead's option click
          // commits. A portal focus transfer can otherwise hide/unmount the
          // listbox between pointerdown and click.
          event.preventDefault();
        }
      },
      style: { display: 'contents' },
    },
    children,
  );
}

function getAstryxChildrenSignature(children: ReactNode): string {
  return JSON.stringify(Children.toArray(children).map(getAstryxNodeSignature));
}

function getAstryxNodeSignature(node: ReactNode): unknown {
  if (!isValidElement<Record<string, unknown>>(node)) {
    return typeof node === 'string' || typeof node === 'number' ? node : null;
  }
  const props = Object.entries(node.props)
    .filter(([key]) => (
      key !== 'children' &&
      key !== 'ref' &&
      !key.startsWith('data-wb-') &&
      !/^on[A-Z]/.test(key)
    ))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, getAstryxPropSignature(key, value)]);
  return {
    key: node.key,
    props,
    type: getAstryxElementName(node),
    children: getAstryxChildrenSignature(node.props.children as ReactNode),
  };
}

function getAstryxPropSignature(key: string, value: unknown): unknown {
  if (key === 'className' && typeof value === 'string') {
    return value.replace(WORKBENCH_RUNTIME_CLASS_PATTERN, '').replace(/\s+/g, ' ').trim();
  }
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => getAstryxPropSignature('', entry));
  if (isValidElement(value)) return getAstryxNodeSignature(value);
  if (typeof value === 'function') return 'function';
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([name]) => !name.startsWith('data-wb-'))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, entry]) => [name, getAstryxPropSignature(name, entry)]);
  }
  return typeof value;
}

function getAstryxElementName(element: ReactElement): string {
  if (typeof element.type === 'string') return element.type;
  const type = element.type as { displayName?: string; name?: string };
  return type.displayName || type.name || 'Component';
}
