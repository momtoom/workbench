import { ChatLayoutScrollButton } from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatLayoutScrollButton>,
  'className' | 'isVisible' | 'label' | 'onClick'
>;

export interface AstryxChatLayoutScrollButtonProps extends RootProps {
  isVisible?: boolean;
  label?: string;
  className?: string;
}

export function AstryxChatLayoutScrollButton({
  isVisible = true,
  label = 'New messages',
  className,
  ...rootProps
}: AstryxChatLayoutScrollButtonProps) {
  return (
    <ChatLayoutScrollButton
      {...rootProps}
      className={cx('astryx-wb-chat-layout-scroll-button', className)}
      isVisible={isVisible}
      label={label || undefined}
      onClick={() => undefined}
    />
  );
}

AstryxChatLayoutScrollButton.displayName = 'AstryxChatLayoutScrollButton';
