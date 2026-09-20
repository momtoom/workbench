import { ChatMessageList } from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxChatDensity = 'compact' | 'balanced' | 'spacious';
export type AstryxChatMessageGap = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatMessageList>,
  'children' | 'className' | 'density' | 'emptyState' | 'gap' | 'isStreaming' | 'scrollToTopAction'
>;

export interface AstryxChatMessageListProps extends RootProps {
  children?: ReactNode;
  density?: AstryxChatDensity;
  gap?: AstryxChatMessageGap;
  isStreaming?: boolean;
  emptyStateText?: string;
  className?: string;
}

export function AstryxChatMessageList({
  children,
  density = 'balanced',
  gap,
  isStreaming = false,
  emptyStateText = 'Start a conversation',
  className,
  ...rootProps
}: AstryxChatMessageListProps) {
  return (
    <ChatMessageList
      {...rootProps}
      className={cx('astryx-wb-chat-message-list', className)}
      density={density}
      emptyState={emptyStateText}
      gap={gap}
      isStreaming={isStreaming}
    >
      {children}
    </ChatMessageList>
  );
}

AstryxChatMessageList.displayName = 'AstryxChatMessageList';
