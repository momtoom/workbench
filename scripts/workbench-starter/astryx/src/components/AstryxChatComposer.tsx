import { ChatComposer } from '@astryxdesign/core/Chat';
import {
  Children,
  isValidElement,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { AstryxChatComposerDrawer } from './AstryxChatComposerDrawer';
import { AstryxChatComposerInput } from './AstryxChatComposerInput';
import {
  AstryxChatComposerSlot,
  type AstryxChatComposerSlotName,
} from './AstryxChatComposerSlot';
import { AstryxChatDictationButton } from './AstryxChatDictationButton';
import { AstryxChatSendButton } from './AstryxChatSendButton';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

export type AstryxChatComposerDensity = 'compact' | 'balanced' | 'spacious';
export type AstryxChatComposerStatus = 'none' | 'warning' | 'error';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatComposer>,
  | 'className'
  | 'density'
  | 'drawer'
  | 'footerActions'
  | 'headerActions'
  | 'headerContext'
  | 'input'
  | 'isDisabled'
  | 'isStopShown'
  | 'onChange'
  | 'onStop'
  | 'onSubmit'
  | 'placeholder'
  | 'sendActions'
  | 'sendButton'
  | 'status'
  | 'statusPosition'
  | 'value'
>;

export interface AstryxChatComposerProps extends RootProps {
  children?: ReactNode;
  placeholder?: string;
  density?: AstryxChatComposerDensity;
  isDisabled?: boolean;
  isStopShown?: boolean;
  status?: AstryxChatComposerStatus;
  statusMessage?: string;
  statusPosition?: 'top' | 'bottom';
  className?: string;
}

export function AstryxChatComposer({
  children,
  placeholder = 'Ask anything',
  density = 'balanced',
  isDisabled = false,
  isStopShown = false,
  status = 'none',
  statusMessage = '',
  statusPosition = 'bottom',
  className,
  ...rootProps
}: AstryxChatComposerProps) {
  const [value, setValue] = useState('');
  const slots = collectChatComposerSlots(children);

  return (
    <ChatComposer
      {...rootProps}
      className={cx('astryx-wb-chat-composer', className)}
      density={density}
      drawer={slots.drawer}
      footerActions={slots.footerActions}
      headerActions={slots.headerActions}
      headerContext={slots.headerContext}
      input={slots.input}
      isDisabled={isDisabled}
      isStopShown={isStopShown}
      onChange={setValue}
      onStop={() => undefined}
      onSubmit={() => setValue('')}
      placeholder={placeholder}
      sendActions={slots.sendActions}
      sendButton={slots.sendButton ?? <AstryxChatSendButton size="md" />}
      status={
        status === 'none'
          ? undefined
          : { type: status, message: statusMessage || undefined }
      }
      statusPosition={statusPosition}
      value={value}
    />
  );
}

function collectChatComposerSlots(children: ReactNode): {
  drawer?: ReactNode;
  footerActions?: ReactNode;
  headerActions?: ReactNode;
  headerContext?: ReactNode;
  input?: ReactNode;
  sendActions?: ReactNode;
  sendButton?: ReactNode;
} {
  const footerActions: ReactNode[] = [];
  const sendActions: ReactNode[] = [];
  let drawer: ReactNode;
  let headerActions: ReactNode;
  let headerContext: ReactNode;
  let input: ReactNode;
  let sendButton: ReactNode;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      footerActions.push(child);
      return;
    }

    if (
      isAstryxElementType(
        child,
        AstryxChatComposerDrawer,
        'AstryxChatComposerDrawer',
      )
    ) {
      drawer = child;
      return;
    }

    if (
      isAstryxElementType(
        child,
        AstryxChatComposerSlot,
        'AstryxChatComposerSlot',
      )
    ) {
      const slot = child.props.slot as AstryxChatComposerSlotName | undefined;
      if (slot === 'header-actions') {
        headerActions = child;
        return;
      }
      if (slot === 'header-context') {
        headerContext = child;
        return;
      }
      if (slot === 'send-actions') {
        sendActions.push(child);
        return;
      }
      footerActions.push(child);
      return;
    }

    if (
      isAstryxElementType(
        child,
        AstryxChatComposerInput,
        'AstryxChatComposerInput',
      )
    ) {
      input = child;
      return;
    }

    if (
      isAstryxElementType(child, AstryxChatSendButton, 'AstryxChatSendButton')
    ) {
      sendButton = child;
      return;
    }

    if (
      isAstryxElementType(
        child,
        AstryxChatDictationButton,
        'AstryxChatDictationButton',
      )
    ) {
      sendActions.push(child);
      return;
    }

    footerActions.push(child);
  });

  return {
    drawer,
    footerActions: footerActions.length ? footerActions : undefined,
    headerActions,
    headerContext,
    input,
    sendActions: sendActions.length ? sendActions : undefined,
    sendButton,
  };
}

AstryxChatComposer.displayName = 'AstryxChatComposer';
