import {
  ChatToolCalls,
  type ChatToolCallItem,
  type ChatToolCallStatus,
} from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatToolCalls>,
  | 'children'
  | 'calls'
  | 'className'
  | 'defaultIsExpanded'
  | 'isExpanded'
  | 'label'
  | 'onExpandedChange'
>;

export interface AstryxChatToolCallProps extends RootProps {
  toolName?: string;
  status?: ChatToolCallStatus;
  target?: string;
  duration?: string;
  node?: string;
  additions?: number;
  deletions?: number;
  errorMessage?: string;
  children?: ReactNode;
  className?: string;
}

export function AstryxChatToolCall({
  toolName = 'bash',
  status = 'complete',
  target = 'yarn test',
  duration = '1.8s',
  node = 'cli:remote-server',
  additions = 14,
  deletions = 0,
  errorMessage = '',
  children,
  className,
  ...rootProps
}: AstryxChatToolCallProps) {
  return (
    <ChatToolCalls
      {...rootProps}
      calls={[
        createAstryxChatToolCallItem({
          toolName,
          status,
          target,
          duration,
          node,
          additions,
          deletions,
          errorMessage,
          children,
          className,
          ...rootProps,
        }),
      ]}
      className={cx('astryx-wb-chat-tool-call', className)}
    />
  );
}

export function createAstryxChatToolCallItem({
  toolName = 'bash',
  status = 'complete',
  target = 'yarn test',
  duration = '1.8s',
  node = 'cli:remote-server',
  additions = 14,
  deletions = 0,
  errorMessage = '',
  children,
  className,
  ...rootProps
}: AstryxChatToolCallProps): ChatToolCallItem {
  return {
    name: toolName,
    status,
    target: target || undefined,
    duration: duration || undefined,
    node: node || undefined,
    additions: additions || undefined,
    deletions: deletions || undefined,
    errorMessage: errorMessage || undefined,
    resultDetail: children || undefined,
    stats: (
      <span
        {...getWorkbenchIdentityProps(rootProps)}
        aria-hidden="true"
        className={cx('astryx-wb-chat-tool-call-marker', className)}
        data-astryx-wb-chat-tool-call-marker="true"
        hidden
      />
    ),
  };
}

AstryxChatToolCall.displayName = 'AstryxChatToolCall';

function getWorkbenchIdentityProps(
  props: Record<string, unknown>,
): Record<string, string> {
  const identityProps: Record<string, string> = {};
  for (const name of [
    'data-wb-preview-node-id',
    'data-wb-runtime-component-root',
    'data-wb-runtime-owner-node-id',
    'data-wb-source-component-name',
    'data-wb-source-preview-only',
  ]) {
    const value = props[name];
    if (typeof value === 'string' && value) identityProps[name] = value;
  }
  return identityProps;
}
