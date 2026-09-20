import { ChatTokenizedText } from '@astryxdesign/core/Chat';
import type { BadgeVariant } from '@astryxdesign/core/Badge';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatTokenizedText>,
  'children' | 'className' | 'tokens'
>;

export interface AstryxChatTokenizedTextProps extends RootProps {
  text?: string;
  tokenValue?: string;
  tokenLabel?: string;
  tokenVariant?: BadgeVariant;
  className?: string;
}

export function AstryxChatTokenizedText({
  text = 'Ask @design about the latest changes.',
  tokenValue = '@design',
  tokenLabel = '@design',
  tokenVariant = 'blue',
  className,
  ...rootProps
}: AstryxChatTokenizedTextProps) {
  return (
    <ChatTokenizedText
      {...rootProps}
      className={cx('astryx-wb-chat-tokenized-text', className)}
      tokens={[{ value: tokenValue, label: tokenLabel, variant: tokenVariant }]}
    >
      {text}
    </ChatTokenizedText>
  );
}

AstryxChatTokenizedText.displayName = 'AstryxChatTokenizedText';
