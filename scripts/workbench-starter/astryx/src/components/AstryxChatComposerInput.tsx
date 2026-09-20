import {
  ChatComposerInput,
  type ChatComposerTrigger,
} from '@astryxdesign/core/Chat';
import {
  createStaticSource,
  type SearchableItem,
} from '@astryxdesign/core/Typeahead';
import {
  Children,
  isValidElement,
  useCallback,
  type ComponentPropsWithoutRef,
  type InputEvent as ReactInputEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxChatComposerSuggestion,
  type AstryxChatComposerSuggestionProps,
} from './AstryxChatComposerSuggestion';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ChatComposerInput>,
  | 'className'
  | 'debounceMs'
  | 'handleRef'
  | 'hasHistory'
  | 'isDisabled'
  | 'label'
  | 'maxRows'
  | 'onChange'
  | 'onFiles'
  | 'onPaste'
  | 'onSubmit'
  | 'pasteAsToken'
  | 'placeholder'
  | 'triggers'
  | 'value'
>;

export interface AstryxChatComposerInputProps extends RootProps {
  children?: ReactNode;
  placeholder?: string;
  label?: string;
  maxRows?: number;
  debounceMs?: number;
  hasHistory?: boolean;
  isDisabled?: boolean;
  mentionMenuLabel?: string;
  commandMenuLabel?: string;
  emptySearchResultsText?: string;
  loadingText?: string;
  className?: string;
}

export function AstryxChatComposerInput({
  children,
  placeholder = 'Type a message…',
  label = 'Message input',
  maxRows = 8,
  debounceMs = 150,
  hasHistory = true,
  isDisabled,
  mentionMenuLabel = 'People',
  commandMenuLabel = 'Commands',
  emptySearchResultsText = 'No results',
  loadingText = 'Searching…',
  className,
  onInputCapture,
  ...rootProps
}: AstryxChatComposerInputProps) {
  const triggers = collectChatComposerTriggers(children, {
    commandMenuLabel,
    emptySearchResultsText,
    loadingText,
    mentionMenuLabel,
  });
  const handleInputCapture = useCallback(
    (event: ReactInputEvent<HTMLDivElement>) => {
      bridgeTriggerAnchorToOwnerDocument(event.currentTarget);
      onInputCapture?.(event);
      if (!event.defaultPrevented) {
        const repairedEditable = normalizeContentEditableSelection(
          event.currentTarget,
        );
        if (repairedEditable) {
          queueMicrotask(() => {
            if (!repairedEditable.isConnected) return;
            const EventConstructor =
              repairedEditable.ownerDocument.defaultView?.Event;
            if (!EventConstructor) return;
            repairedEditable.dispatchEvent(
              new EventConstructor('input', { bubbles: true }),
            );
          });
        }
      }
    },
    [onInputCapture],
  );

  return (
    <ChatComposerInput
      {...rootProps}
      className={cx('astryx-wb-chat-composer-input', className)}
      debounceMs={debounceMs}
      hasHistory={hasHistory}
      isDisabled={isDisabled}
      label={label}
      maxRows={maxRows}
      onInputCapture={handleInputCapture}
      placeholder={placeholder || undefined}
      triggers={triggers.length ? triggers : undefined}
    />
  );
}

AstryxChatComposerInput.displayName = 'AstryxChatComposerInput';

type SuggestionData = {
  tokenLabel: string;
  tokenValue: string;
  variant: NonNullable<AstryxChatComposerSuggestionProps['variant']>;
};

type TriggerAnchorBridge = {
  bridgedAppendChild: typeof HTMLElement.prototype.appendChild;
  originalAppendChild: typeof HTMLElement.prototype.appendChild;
  restoreTimer: number | null;
  targetBody: HTMLElement;
};

const triggerAnchorBridges = new WeakMap<HTMLElement, TriggerAnchorBridge>();

function collectChatComposerTriggers(
  children: ReactNode,
  labels: {
    mentionMenuLabel: string;
    commandMenuLabel: string;
    emptySearchResultsText: string;
    loadingText: string;
  },
): ChatComposerTrigger[] {
  const groupedItems = new Map<string, SearchableItem<SuggestionData>[]>();

  Children.forEach(children, (child) => {
    if (
      !isValidElement<AstryxChatComposerSuggestionProps>(child) ||
      !isAstryxElementType(
        child,
        AstryxChatComposerSuggestion,
        'AstryxChatComposerSuggestion',
      )
    ) {
      return;
    }

    const suggestion =
      child as ReactElement<AstryxChatComposerSuggestionProps>;
    const trigger = suggestion.props.trigger || '@';
    const normalizedValue = normalizeSuggestionValue(
      suggestion.props.value || suggestion.props.label || 'suggestion',
      trigger,
    );
    const label = suggestion.props.label || normalizedValue;
    const variant =
      suggestion.props.variant || (trigger === '/' ? 'yellow' : 'blue');
    const tokenLabel =
      suggestion.props.tokenLabel || (trigger === '/' ? `/${label}` : label);
    const item: SearchableItem<SuggestionData> = {
      id: `${trigger}:${normalizedValue}`,
      label,
      element: suggestion,
      auxiliaryData: {
        tokenLabel,
        tokenValue: `${trigger}${normalizedValue}`,
        variant,
      },
    };
    const items = groupedItems.get(trigger) ?? [];
    items.push(item);
    groupedItems.set(trigger, items);
  });

  return Array.from(groupedItems.entries()).map(([character, items]) => ({
    character,
    searchSource: createStaticSource(items),
    renderItem: (item) => item.element ?? item.label,
    onSelect: (item) => {
      const data = item.auxiliaryData as SuggestionData;
      return {
        value: data.tokenValue,
        label: data.tokenLabel,
        variant: data.variant,
      };
    },
    emptySearchResultsText: labels.emptySearchResultsText,
    loadingText: labels.loadingText,
    menuLabel:
      character === '@' ? labels.mentionMenuLabel : labels.commandMenuLabel,
  }));
}

function normalizeSuggestionValue(value: string, trigger: string): string {
  const trimmedValue = value.trim();
  return trimmedValue.startsWith(trigger)
    ? trimmedValue.slice(trigger.length)
    : trimmedValue;
}

function normalizeContentEditableSelection(
  root: HTMLDivElement,
): HTMLElement | null {
  const editable = root.matches('[contenteditable="true"]')
    ? root
    : root.querySelector<HTMLElement>('[contenteditable="true"]');
  const selection = root.ownerDocument.defaultView?.getSelection();
  if (
    !editable ||
    !selection ||
    selection.rangeCount === 0 ||
    !selection.isCollapsed
  ) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (range.startContainer !== editable) return null;

  const childOffset = range.startOffset;
  const candidate =
    editable.childNodes[childOffset - 1] ?? editable.childNodes[childOffset];
  if (!candidate || candidate.nodeType !== Node.TEXT_NODE) return null;

  const textNode = candidate as Text;
  const nextRange = root.ownerDocument.createRange();
  nextRange.setStart(
    textNode,
    childOffset > 0 ? textNode.data.length : 0,
  );
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  return editable;
}

function bridgeTriggerAnchorToOwnerDocument(root: HTMLDivElement): void {
  const ownerDocument = root.ownerDocument;
  const hostDocument = document;
  const hostBody = hostDocument.body;
  const ownerBody = ownerDocument.body;
  if (!hostBody || !ownerBody || ownerDocument === hostDocument) return;

  let bridge = triggerAnchorBridges.get(hostBody);
  if (!bridge) {
    const originalAppendChild = hostBody.appendChild;
    const bridgeState: TriggerAnchorBridge = {
      bridgedAppendChild: originalAppendChild,
      originalAppendChild,
      restoreTimer: null,
      targetBody: ownerBody,
    };
    const bridgedAppendChild = function <NodeType extends Node>(
      this: HTMLElement,
      node: NodeType,
    ): NodeType {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as unknown as Element).hasAttribute('data-astryx-trigger-anchor')
      ) {
        return bridgeState.targetBody.appendChild(node) as NodeType;
      }
      return bridgeState.originalAppendChild.call(this, node) as NodeType;
    };

    bridgeState.bridgedAppendChild = bridgedAppendChild;
    bridge = bridgeState;
    triggerAnchorBridges.set(hostBody, bridge);
    hostBody.appendChild = bridgedAppendChild;
  } else {
    bridge.targetBody = ownerBody;
  }

  const hostWindow = hostDocument.defaultView;
  if (bridge.restoreTimer !== null && hostWindow) {
    hostWindow.clearTimeout(bridge.restoreTimer);
  }
  const restore = () => {
    if (hostBody.appendChild === bridge.bridgedAppendChild) {
      hostBody.appendChild = bridge.originalAppendChild;
    }
    triggerAnchorBridges.delete(hostBody);
  };
  bridge.restoreTimer = hostWindow
    ? hostWindow.setTimeout(restore, 0)
    : null;
  if (!hostWindow) queueMicrotask(restore);
}
