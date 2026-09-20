import { ChatMessageBubble } from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxChatMessageBubbleVariant = 'filled' | 'ghost';
export type AstryxChatMessageBubbleGroup = 'none' | 'first' | 'middle' | 'last';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatMessageBubble>,
  'children' | 'className' | 'group' | 'metadata' | 'name' | 'variant'
>;

export interface AstryxChatMessageBubbleProps extends RootProps {
  children?: ReactNode;
  name?: string;
  variant?: AstryxChatMessageBubbleVariant;
  group?: AstryxChatMessageBubbleGroup;
  className?: string;
}

export function AstryxChatMessageBubble({
  children,
  name = '',
  variant = 'filled',
  group = 'none',
  className,
  ...rootProps
}: AstryxChatMessageBubbleProps) {
  return (
    <ChatMessageBubble
      {...rootProps}
      className={cx('astryx-wb-chat-message-bubble', className)}
      group={group === 'none' ? undefined : group}
      name={name}
      variant={variant}
    >
      {children}
    </ChatMessageBubble>
  );
}

AstryxChatMessageBubble.displayName = 'AstryxChatMessageBubble';
