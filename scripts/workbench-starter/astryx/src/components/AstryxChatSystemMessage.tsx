import { ChatSystemMessage } from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxChatSystemMessageVariant = 'default' | 'divider';

type AstryxChatSystemMessageRootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatSystemMessage>,
  'children' | 'className' | 'icon' | 'variant'
>;

export interface AstryxChatSystemMessageProps extends AstryxChatSystemMessageRootProps {
  message?: string;
  variant?: AstryxChatSystemMessageVariant;
  className?: string;
}

export function AstryxChatSystemMessage({
  message = 'Today',
  variant = 'divider',
  className,
  ...rootProps
}: AstryxChatSystemMessageProps) {
  return (
    <ChatSystemMessage
      {...rootProps}
      className={cx('astryx-wb-chat-system-message', className)}
      variant={variant}
    >
      {message}
    </ChatSystemMessage>
  );
}

AstryxChatSystemMessage.displayName = 'AstryxChatSystemMessage';
