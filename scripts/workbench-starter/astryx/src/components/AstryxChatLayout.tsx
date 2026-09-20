import { ChatLayout } from '@astryxdesign/core/Chat';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AstryxChatComposer } from './AstryxChatComposer';
import { AstryxChatLayoutScrollButton } from './AstryxChatLayoutScrollButton';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

export type AstryxChatLayoutDensity = 'compact' | 'balanced' | 'spacious';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatLayout>,
  'children' | 'className' | 'composer' | 'density' | 'emptyState' | 'scrollButton' | 'scrollRef'
>;

export interface AstryxChatLayoutProps extends RootProps {
  children?: ReactNode;
  density?: AstryxChatLayoutDensity;
  emptyStateText?: string;
  className?: string;
}

export function AstryxChatLayout({
  children,
  density = 'balanced',
  emptyStateText = 'Start a conversation',
  className,
  ...rootProps
}: AstryxChatLayoutProps) {
  const slots = collectChatLayoutSlots(children);

  return (
    <ChatLayout
      {...rootProps}
      className={cx('astryx-wb-chat-layout', className)}
      composer={slots.composer ?? <AstryxChatComposer />}
      density={density}
      emptyState={emptyStateText}
      scrollButton={slots.scrollButton ?? null}
    >
      {slots.messages}
    </ChatLayout>
  );
}

function collectChatLayoutSlots(children: ReactNode): {
  composer?: ReactNode;
  messages?: ReactNode;
  scrollButton?: ReactNode;
} {
  const messages: ReactNode[] = [];
  let composer: ReactNode;
  let scrollButton: ReactNode;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      messages.push(child);
      return;
    }

    if (isAstryxElementType(child, AstryxChatComposer, 'AstryxChatComposer')) {
      composer = child;
      return;
    }

    if (
      isAstryxElementType(
        child,
        AstryxChatLayoutScrollButton,
        'AstryxChatLayoutScrollButton',
      )
    ) {
      scrollButton = child;
      return;
    }

    messages.push(child);
  });

  return {
    composer,
    messages: messages.length ? messages : undefined,
    scrollButton,
  };
}

AstryxChatLayout.displayName = 'AstryxChatLayout';
