import { ChatToolCalls, type ChatToolCallItem } from '@astryxdesign/core/Chat';
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxChatToolCall,
  createAstryxChatToolCallItem,
  type AstryxChatToolCallProps,
} from './AstryxChatToolCall';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatToolCalls>,
  | 'calls'
  | 'className'
  | 'defaultIsExpanded'
  | 'isExpanded'
  | 'label'
  | 'onExpandedChange'
>;

export interface AstryxChatToolCallsProps extends RootProps {
  children?: ReactNode;
  label?: string;
  isDefaultExpanded?: boolean;
  className?: string;
}

export function AstryxChatToolCalls({
  children,
  label = '',
  isDefaultExpanded = true,
  className,
  ...rootProps
}: AstryxChatToolCallsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const calls = useMemo(() => collectAstryxChatToolCalls(children), [children]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const projectCallIdentity = () => {
      for (const marker of root.querySelectorAll<HTMLElement>(
        '[data-astryx-wb-chat-tool-call-marker="true"]',
      )) {
        const stats = marker.parentElement;
        const row = stats?.parentElement;
        if (!stats || !row) continue;
        projectWorkbenchSourceIdentity(marker, row);
        row.setAttribute('data-wb-runtime-direct-select', 'true');
        if (stats.children.length === 1) stats.style.display = 'none';
      }
    };
    projectCallIdentity();
    const RuntimeMutationObserver = root.ownerDocument.defaultView?.MutationObserver;
    if (!RuntimeMutationObserver) return;
    const observer = new RuntimeMutationObserver(projectCallIdentity);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [calls]);

  return (
    <ChatToolCalls
      {...rootProps}
      calls={calls}
      className={cx('astryx-wb-chat-tool-calls', className)}
      defaultIsExpanded={isDefaultExpanded}
      label={label || undefined}
      ref={rootRef}
    />
  );
}

function collectAstryxChatToolCalls(children: ReactNode): ChatToolCallItem[] {
  const calls: ChatToolCallItem[] = [];
  for (const child of Children.toArray(children)) {
    collectAstryxChatToolCallFromNode(child, calls);
  }
  return calls;
}

function collectAstryxChatToolCallFromNode(
  node: ReactNode,
  calls: ChatToolCallItem[],
) {
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  const element = node as ReactElement<AstryxChatToolCallProps>;
  const props = element.props as AstryxChatToolCallProps &
    { children?: ReactNode } &
    Record<string, unknown>;

  if (
    isAstryxElementType(
      node,
      AstryxChatToolCall,
      'AstryxChatToolCall',
    ) ||
    isAstryxChatToolCallProps(props)
  ) {
    calls.push(createAstryxChatToolCallItem(props));
    return;
  }

  for (const child of Children.toArray(props.children)) {
    collectAstryxChatToolCallFromNode(child, calls);
  }
}

function isAstryxChatToolCallProps(
  props: { children?: ReactNode } & Record<string, unknown>,
): boolean {
  return (
    typeof props.toolName === 'string' &&
    (
      props.status === undefined ||
      props.status === 'pending' ||
      props.status === 'running' ||
      props.status === 'complete' ||
      props.status === 'error'
    )
  );
}

AstryxChatToolCalls.displayName = 'AstryxChatToolCalls';

function projectWorkbenchSourceIdentity(
  source: HTMLElement,
  target: HTMLElement,
) {
  for (const attribute of [
    'data-wb-preview-node-id',
    'data-wb-runtime-component-root',
    'data-wb-runtime-owner-node-id',
    'data-wb-source-component-name',
    'data-wb-source-preview-only',
  ]) {
    const value = source.getAttribute(attribute);
    if (value) target.setAttribute(attribute, value);
  }
  for (const className of Array.from(target.classList)) {
    if (className.startsWith('wb-source-runtime-root-')) {
      target.classList.remove(className);
    }
  }
  for (const className of source.classList) {
    if (className.startsWith('wb-source-runtime-root-')) {
      target.classList.add(className);
    }
  }
}
