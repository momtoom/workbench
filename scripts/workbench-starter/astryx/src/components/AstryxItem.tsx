import { Item } from '@astryxdesign/core/Item';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import {
  collectAstryxItemSlots,
} from './AstryxItemSlot';

export type AstryxItemAlign = 'center' | 'start';
export type AstryxItemDensity = 'compact' | 'balanced' | 'spacious';
export type AstryxItemElement = 'div' | 'li' | 'span';

type AstryxItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof Item>,
  | 'align'
  | 'as'
  | 'className'
  | 'density'
  | 'description'
  | 'descriptionLines'
  | 'endContent'
  | 'href'
  | 'isDisabled'
  | 'isHighlighted'
  | 'isSelected'
  | 'label'
  | 'labelLines'
  | 'marker'
  | 'onClick'
  | 'startContent'
  | 'target'
>;

export interface AstryxItemProps extends AstryxItemRootProps {
  label?: string;
  description?: string;
  children?: ReactNode;
  marker?: string;
  startIcon?: AstryxIconValue | 'none';
  endText?: string;
  as?: AstryxItemElement;
  align?: AstryxItemAlign;
  density?: AstryxItemDensity;
  labelLines?: number;
  descriptionLines?: number;
  href?: string;
  target?: '_blank' | '_self';
  isHighlighted?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isClickable?: boolean;
  className?: string;
}

export function AstryxItem({
  label = 'Repository sync',
  description = 'Last updated just now',
  children,
  marker,
  startIcon = 'none',
  endText,
  as = 'div',
  align = 'center',
  density = 'balanced',
  labelLines = 1,
  descriptionLines = 2,
  href,
  target,
  isHighlighted = false,
  isSelected = false,
  isDisabled = false,
  isClickable = false,
  className,
  ...rootProps
}: AstryxItemProps) {
  const slots = collectAstryxItemSlots(children);
  const startContent = slots.start ?? (
    startIcon === 'none' || startIcon === '' ? undefined : <AstryxIcon icon={startIcon || 'check'} />
  );
  const bodyContent = slots.body ?? label;

  return (
    <Item
      {...rootProps}
      align={align}
      as={as}
      className={className}
      density={density}
      description={slots.body ? undefined : description || undefined}
      descriptionLines={descriptionLines}
      endContent={slots.end ?? (endText || undefined)}
      href={href || undefined}
      isDisabled={isDisabled}
      isHighlighted={isHighlighted}
      isSelected={isSelected}
      label={bodyContent}
      labelLines={labelLines}
      marker={slots.marker ?? (marker || undefined)}
      onClick={isClickable ? () => undefined : undefined}
      startContent={startContent}
      target={target}
    />
  );
}
