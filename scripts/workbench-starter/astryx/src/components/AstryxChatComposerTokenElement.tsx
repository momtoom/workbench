import { ChatComposerTokenElement } from '@astryxdesign/core/Chat';
import type { BadgeVariant } from '@astryxdesign/core/Badge';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>;

export interface AstryxChatComposerTokenElementProps extends RootProps {
  value?: string;
  label?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function AstryxChatComposerTokenElement({
  value = '@design',
  label = '@design',
  variant = 'blue',
  className,
  ...rootProps
}: AstryxChatComposerTokenElementProps) {
  return (
    <span
      {...rootProps}
      className={cx('astryx-wb-chat-composer-token-element', className)}
    >
      <ChatComposerTokenElement token={{ value, label, variant }} />
    </span>
  );
}

AstryxChatComposerTokenElement.displayName = 'AstryxChatComposerTokenElement';
