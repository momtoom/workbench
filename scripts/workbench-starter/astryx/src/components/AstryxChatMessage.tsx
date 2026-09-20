import { Avatar } from '@astryxdesign/core/Avatar';
import {
  ChatMessage,
  ChatMessageBubble,
  ChatMessageMetadata,
} from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxChatMessageSender = 'assistant' | 'user';
export type AstryxChatMessageStatus = 'none' | 'sending' | 'sent' | 'read' | 'error';
export type AstryxChatMessageDensity = 'compact' | 'balanced' | 'spacious';

type AstryxChatMessageRootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatMessage>,
  'avatar' | 'children' | 'className' | 'density' | 'sender'
>;

export interface AstryxChatMessageProps extends AstryxChatMessageRootProps {
  children?: ReactNode;
  sender?: AstryxChatMessageSender;
  name?: string;
  message?: string;
  timestamp?: string;
  status?: AstryxChatMessageStatus;
  hasAvatar?: boolean;
  avatarName?: string;
  avatarImage?: string;
  density?: AstryxChatMessageDensity;
  className?: string;
}

export function AstryxChatMessage({
  children,
  sender = 'assistant',
  name = 'Astryx Assistant',
  message = 'How can I help?',
  timestamp = '',
  status = 'none',
  hasAvatar,
  avatarName,
  avatarImage,
  density,
  className,
  ...rootProps
}: AstryxChatMessageProps) {
  const content = children ?? (
    <ChatMessageBubble
      metadata={
        timestamp || status !== 'none'
          ? (
              <ChatMessageMetadata
                status={status === 'none' ? undefined : status}
                timestamp={timestamp || undefined}
              />
            )
          : undefined
      }
      name={name}
    >
      {message}
    </ChatMessageBubble>
  );

  return (
    <ChatMessage
      {...rootProps}
      avatar={
        (hasAvatar ?? sender === 'assistant')
          ? (
              <Avatar
                name={avatarName || name}
                size="sm"
                src={avatarImage || undefined}
              />
            )
          : undefined
      }
      className={cx('astryx-wb-chat-message', className)}
      density={density}
      sender={sender}
    >
      {content}
    </ChatMessage>
  );
}

AstryxChatMessage.displayName = 'AstryxChatMessage';
