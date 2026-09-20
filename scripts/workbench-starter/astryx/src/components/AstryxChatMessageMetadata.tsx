import { ChatMessageMetadata } from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxChatMessageMetadataStatus =
  | 'none'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'error';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatMessageMetadata>,
  'children' | 'className' | 'footer' | 'status' | 'timestamp'
>;

export interface AstryxChatMessageMetadataProps extends RootProps {
  timestamp?: string;
  status?: AstryxChatMessageMetadataStatus;
  children?: ReactNode;
  className?: string;
}

export function AstryxChatMessageMetadata({
  timestamp = '10:24',
  status = 'none',
  children,
  className,
  ...rootProps
}: AstryxChatMessageMetadataProps) {
  return (
    <ChatMessageMetadata
      {...rootProps}
      className={cx('astryx-wb-chat-message-metadata', className)}
      footer={children || undefined}
      status={status === 'none' ? undefined : status}
      timestamp={timestamp || undefined}
    />
  );
}

AstryxChatMessageMetadata.displayName = 'AstryxChatMessageMetadata';
