import { ListItem } from '@astryxdesign/core/List';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { collectAstryxItemSlots } from './AstryxItemSlot';

type AstryxListItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof ListItem>,
  | 'className'
  | 'description'
  | 'endContent'
  | 'href'
  | 'isDisabled'
  | 'isSelected'
  | 'label'
  | 'onClick'
  | 'startContent'
  | 'target'
>;

export interface AstryxListItemProps extends AstryxListItemRootProps {
  label?: string;
  description?: string;
  children?: ReactNode;
  startIcon?: AstryxIconValue | 'none';
  endText?: string;
  href?: string;
  target?: '_blank' | '_self';
  isDisabled?: boolean;
  isSelected?: boolean;
  isClickable?: boolean;
  className?: string;
}

export function AstryxListItem({
  label = 'List item',
  description,
  children,
  startIcon = 'none',
  endText,
  href,
  target,
  isDisabled = false,
  isSelected = false,
  isClickable = false,
  className,
  ...rootProps
}: AstryxListItemProps) {
  const slots = collectAstryxItemSlots(children);
  const startContent = slots.start ?? (
    startIcon === 'none' || startIcon === '' ? undefined : <AstryxIcon icon={startIcon || 'check'} />
  );
  const bodyContent = slots.body ?? label;

  return (
    <ListItem
      {...rootProps}
      className={className}
      description={slots.body ? undefined : description || undefined}
      endContent={slots.end ?? (endText || undefined)}
      href={href || undefined}
      isDisabled={isDisabled}
      isSelected={isSelected}
      label={bodyContent}
      onClick={isClickable ? () => undefined : undefined}
      startContent={startContent}
      target={target}
    />
  );
}
