import { ChatComposerDrawer } from '@astryxdesign/core/Chat';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatComposerDrawer>,
  'children' | 'className' | 'count' | 'defaultIsCollapsed' | 'isCollapsed' | 'label' | 'onCollapsedChange'
>;

export interface AstryxChatComposerDrawerProps extends RootProps {
  children?: ReactNode;
  count?: number;
  label?: string;
  isDefaultCollapsed?: boolean;
  className?: string;
}

export function AstryxChatComposerDrawer({
  children,
  count,
  label = 'Attachments',
  isDefaultCollapsed = false,
  className,
  ...rootProps
}: AstryxChatComposerDrawerProps) {
  return (
    <ChatComposerDrawer
      {...rootProps}
      className={cx('astryx-wb-chat-composer-drawer', className)}
      count={count}
      defaultIsCollapsed={isDefaultCollapsed}
      label={label}
    >
      {children}
    </ChatComposerDrawer>
  );
}

AstryxChatComposerDrawer.displayName = 'AstryxChatComposerDrawer';
