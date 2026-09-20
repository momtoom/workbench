import { CommandPalette } from '@astryxdesign/core/CommandPalette';
import {
  createStaticSource,
} from '@astryxdesign/core/Typeahead';
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxButton,
  type AstryxButtonProps,
} from './AstryxButton';
import {
  AstryxCommandPaletteFooter,
  type AstryxCommandPaletteFooterProps,
} from './AstryxCommandPaletteFooter';
import {
  AstryxCommandPaletteInput,
  type AstryxCommandPaletteInputProps,
} from './AstryxCommandPaletteInput';
import {
  AstryxSearchItem,
  type AstryxSearchableItem,
  type AstryxSearchItemProps,
} from './AstryxSearchItem';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;
export type AstryxCommandPaletteItem = Pick<
  AstryxSearchItemProps,
  | 'id'
  | 'label'
  | 'description'
  | 'group'
  | 'icon'
  | 'endLabel'
  | 'isDefaultSelected'
>;
export interface AstryxCommandPaletteProps extends RootProps {
  children?: ReactNode;
  items?: readonly AstryxCommandPaletteItem[];
  label?: string;
  emptySearchText?: string;
  emptyBootstrapText?: string;
  isDefaultOpen?: boolean;
  isInline?: boolean;
  width?: string;
  maxHeight?: string;
  className?: string;
}
const EMPTY_ITEMS: readonly AstryxCommandPaletteItem[] = [];
const KEYBOARD_NAVIGATION_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
]);

export function AstryxCommandPalette({
  children,
  items = EMPTY_ITEMS,
  label = 'Command palette',
  emptySearchText = 'No commands found',
  emptyBootstrapText = 'Type to search commands',
  isDefaultOpen = true,
  isInline = true,
  width = '640px',
  maxHeight = '480px',
  className,
  onKeyDownCapture,
  onPointerMove,
  ...rootProps
}: AstryxCommandPaletteProps) {
  const stableChildren = useStableAstryxChildren(children);
  const commands = useMemo(
    () => items.map(createCommandPaletteItem),
    [items],
  );
  const source = useMemo(() => createStaticSource(commands), [commands]);
  // Typeahead reads a static source when it mounts. Remount when any source
  // item field changes so Binding edits repaint the rendered command rows.
  const itemDataKey = JSON.stringify(items);
  const input = findSlotElement<AstryxCommandPaletteInputProps>(
    stableChildren,
    AstryxCommandPaletteInput,
    'AstryxCommandPaletteInput',
  );
  const footer = findSlotElement<AstryxCommandPaletteFooterProps>(
    stableChildren,
    AstryxCommandPaletteFooter,
    'AstryxCommandPaletteFooter',
  );
  const trigger = findSlotElement<AstryxButtonProps>(
    stableChildren,
    AstryxButton,
    'AstryxButton',
  );
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [inputModality, setInputModality] = useState<'keyboard' | 'pointer'>('pointer');
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const triggerSlot = trigger
    ? cloneElement(trigger, {
        onClick: (...args: Parameters<NonNullable<AstryxButtonProps['onClick']>>) => {
          trigger.props.onClick?.(...args);
          setIsOpen(true);
        },
      } as Partial<AstryxButtonProps>)
    : null;
  const footerNodeId = (footer?.props as Record<string, unknown> | undefined)?.[
    'data-wb-preview-node-id'
  ];
  const footerSlot = footer ? (
    <div
      className={cx('astryx-wb-command-palette-footer-slot', footer.props.className)}
      data-wb-preview-node-id={typeof footerNodeId === 'string' ? footerNodeId : undefined}
    >
      {cloneElement(footer, {
        className: undefined,
        'data-wb-preview-node-id': undefined,
      } as Partial<AstryxCommandPaletteFooterProps>)}
    </div>
  ) : undefined;
  useEffect(() => setIsOpen(isDefaultOpen), [isDefaultOpen]);
  const handleKeyDownCapture = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(event);
    if (!event.defaultPrevented && KEYBOARD_NAVIGATION_KEYS.has(event.key)) {
      setInputModality('keyboard');
    }
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const previous = lastPointerPositionRef.current;
    const next = { x: event.clientX, y: event.clientY };
    lastPointerPositionRef.current = next;
    if (
      inputModality === 'keyboard' &&
      (!previous || previous.x !== next.x || previous.y !== next.y)
    ) {
      setInputModality('pointer');
    }
  };
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-launcher', className)}
      data-astryx-command-palette-input-modality={inputModality}
      onKeyDownCapture={handleKeyDownCapture}
      onPointerMove={handlePointerMove}
    >
      {!isInline && !isOpen ? triggerSlot : null}
      <CommandPalette
        key={itemDataKey}
        className="astryx-wb-command-palette"
        emptyBootstrapText={emptyBootstrapText}
        emptySearchText={emptySearchText}
        isInline={isInline}
        isOpen={isOpen}
        input={input ?? <></>}
        label={label}
        maxHeight={resolveSize(maxHeight)}
        onOpenChange={setIsOpen}
        renderItem={(item) => item.element ?? item.label}
        searchSource={source}
        footer={footerSlot ?? <></>}
        width={resolveCommandPaletteWidth(width)}
      />
    </div>
  );
}

function findSlotElement<Props>(
  children: ReactNode,
  component: unknown,
  name: string,
): ReactElement<Props> | undefined {
  return Children.toArray(children).find((child): child is ReactElement<Props> => {
    if (!isValidElement(child)) return false;
    if (child.type === component) return true;
    const type = child.type as { displayName?: string; name?: string } | null;
    return type?.displayName === name || type?.name === name;
  });
}

function resolveSize(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}

function resolveCommandPaletteWidth(value: string): number | string {
  if (value === 'full') return '100%';
  if (value === 'sm') return '480px';
  if (value === 'md') return '640px';
  if (value === 'lg') return '800px';
  return resolveSize(value);
}

function createCommandPaletteItem(
  item: AstryxCommandPaletteItem,
  index: number,
): AstryxSearchableItem {
  const label = item.label?.trim() || `Command ${index + 1}`;
  const id = item.id?.trim() || slug(label) || `command-${index + 1}`;
  const group = item.group?.trim() || undefined;
  return {
    id,
    label,
    element: (
      <AstryxSearchItem
        description={item.description}
        endLabel={item.endLabel}
        group={group}
        icon={item.icon}
        id={id}
        isDefaultSelected={item.isDefaultSelected}
        label={label}
      />
    ),
    auxiliaryData: {
      group,
      isDefaultSelected: item.isDefaultSelected === true,
    },
  };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
