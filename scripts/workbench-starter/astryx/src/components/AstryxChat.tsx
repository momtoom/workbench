import {
  ChatLayout,
  ChatMessageList,
} from '@astryxdesign/core/Chat';
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { AstryxChatComposer } from './AstryxChatComposer';
import { AstryxChatComposerInput } from './AstryxChatComposerInput';
import { AstryxChatSendButton } from './AstryxChatSendButton';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxChatDensity = 'compact' | 'balanced' | 'spacious';
type RootProps = Omit<ComponentPropsWithoutRef<typeof ChatLayout>, 'children' | 'className' | 'composer' | 'density' | 'emptyState' | 'scrollButton'>;
export interface AstryxChatProps extends RootProps {
  children?: ReactNode;
  density?: AstryxChatDensity;
  isStreaming?: boolean;
  className?: string;
}
export function AstryxChat({
  children,
  density = 'balanced',
  isStreaming = false,
  className,
  ...rootProps
}: AstryxChatProps) {
  const stableChildren = useStableAstryxChildren(children);
  const slots = collectChatSlots(stableChildren);
  const composer = slots.composer ?? (
    <AstryxChatComposer density={density}>
      <AstryxChatComposerInput label="Message input" />
      <AstryxChatSendButton size="md" />
    </AstryxChatComposer>
  );

  return (
    <ChatLayout
      {...rootProps}
      className={cx('astryx-wb-chat', className)}
      composer={composer}
      density={density}
      emptyState="Start a conversation"
      scrollButton={null}
    >
      <ChatMessageList density={density} isStreaming={isStreaming}>
        {slots.messages}
      </ChatMessageList>
    </ChatLayout>
  );
}

function collectChatSlots(children: ReactNode): {
  composer?: ReactNode;
  messages?: ReactNode;
} {
  const messages: ReactNode[] = [];
  let composer: ReactNode;

  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      isAstryxElementType(child, AstryxChatComposer, 'AstryxChatComposer')
    ) {
      composer = child;
      return;
    }
    messages.push(child);
  });

  return {
    composer,
    messages: messages.length ? messages : undefined,
  };
}
