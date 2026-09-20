import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxChatComposerSlotName =
  | 'header-actions'
  | 'header-context'
  | 'footer-actions'
  | 'send-actions';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxChatComposerSlotProps extends RootProps {
  slot?: AstryxChatComposerSlotName;
  children?: ReactNode;
  className?: string;
}

export function AstryxChatComposerSlot({
  slot = 'header-actions',
  children,
  className,
  ...rootProps
}: AstryxChatComposerSlotProps) {
  return (
    <div
      {...rootProps}
      className={cx(
        'astryx-wb-chat-composer-slot flex min-w-0 items-center gap-1',
        className,
      )}
      data-astryx-chat-composer-slot={slot}
    >
      {children}
    </div>
  );
}

AstryxChatComposerSlot.displayName = 'AstryxChatComposerSlot';
