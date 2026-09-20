import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxItemSlotKind = 'marker' | 'start' | 'body' | 'end';

export interface AstryxItemSlotProps {
  slot?: AstryxItemSlotKind;
  children?: ReactNode;
  className?: string;
}

type AstryxItemSlotComponent = ((props: AstryxItemSlotProps) => ReactNode) & {
  __astryxItemSlot: true;
};

export const AstryxItemSlot = function AstryxItemSlot({
  slot = 'body',
  children,
  className,
}: AstryxItemSlotProps) {
  return (
    <span
      className={cx('astryx-wb-item-slot', `astryx-wb-item-slot--${slot}`, className)}
      data-astryx-item-slot={slot}
    >
      {children}
    </span>
  );
} as AstryxItemSlotComponent;

AstryxItemSlot.__astryxItemSlot = true;

export function isAstryxItemSlotElement(node: ReactNode): node is ReactElement<AstryxItemSlotProps> {
  return isValidElement(node) && Boolean((node.type as Partial<AstryxItemSlotComponent>).__astryxItemSlot);
}

export function getAstryxRenderedItemSlotKind(node: ReactNode): AstryxItemSlotKind | null {
  if (!isValidElement(node)) return null;
  if (isAstryxItemSlotElement(node)) return normalizeAstryxItemSlotKind(node.props.slot);
  const props = node.props as { 'data-astryx-item-slot'?: unknown };
  return typeof props['data-astryx-item-slot'] === 'string'
    ? normalizeAstryxItemSlotKind(props['data-astryx-item-slot'])
    : null;
}

export function isAstryxItemSlotFragment(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement(node) && node.type === Fragment;
}

export function normalizeAstryxItemSlotKind(value: unknown): AstryxItemSlotKind {
  return value === 'marker' || value === 'start' || value === 'end' ? value : 'body';
}

export type AstryxItemSlotContent = Partial<Record<AstryxItemSlotKind, ReactNode>>;

export function collectAstryxItemSlots(children: ReactNode): AstryxItemSlotContent {
  const slotNodes: Record<AstryxItemSlotKind, ReactNode[]> = {
    marker: [],
    start: [],
    body: [],
    end: [],
  };

  const collect = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (child == null || typeof child === 'boolean') return;
      if (isAstryxItemSlotFragment(child)) {
        collect(child.props.children);
        return;
      }
      const slot = getAstryxRenderedItemSlotKind(child);
      if (slot && isValidElement<{ children?: ReactNode }>(child)) {
        slotNodes[slot].push(child.props.children);
        return;
      }
      slotNodes.body.push(child);
    });
  };

  collect(children);

  return Object.fromEntries(
    Object.entries(slotNodes)
      .filter(([, nodes]) => nodes.length > 0)
      .map(([slot, nodes]) => [slot, nodes.length === 1 ? nodes[0] : nodes]),
  ) as AstryxItemSlotContent;
}
