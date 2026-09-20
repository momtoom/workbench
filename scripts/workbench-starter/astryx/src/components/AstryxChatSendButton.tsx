import { IconButton } from '@astryxdesign/core/IconButton';
import { getIcon } from '@astryxdesign/core/Icon';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof IconButton>,
  | 'className'
  | 'icon'
  | 'isDisabled'
  | 'label'
  | 'size'
  | 'variant'
>;

export interface AstryxChatSendButtonProps extends RootProps {
  isStopShown?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function AstryxChatSendButton({
  isStopShown = false,
  isDisabled = false,
  size = 'md',
  className,
  ...rootProps
}: AstryxChatSendButtonProps) {
  return (
    <IconButton
      {...rootProps}
      className={cx('astryx-wb-chat-send-button rounded-full', className)}
      icon={getIcon(isStopShown ? 'stop' : 'arrowUp')}
      isDisabled={!isStopShown && isDisabled}
      label={isStopShown ? 'Stop' : 'Send'}
      onClick={() => undefined}
      size={size}
      variant={isStopShown ? 'secondary' : 'primary'}
    />
  );
}

AstryxChatSendButton.displayName = 'AstryxChatSendButton';
