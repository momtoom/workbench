import { Toolbar } from '@astryxdesign/core/Toolbar';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';
import { cx } from './classNames';
import type { AstryxSectionVariant } from './AstryxSection';
import type { AstryxStackGap } from './AstryxStack';
import { AstryxToolbarSlot, type AstryxToolbarSlotPosition } from './AstryxToolbarSlot';
import { isAstryxElementType } from './AstryxWorkbenchChild';

export type AstryxToolbarSize = 'sm' | 'md' | 'lg';
export type AstryxToolbarOrientation = 'horizontal' | 'vertical';

type AstryxToolbarRootProps = Omit<
  ComponentPropsWithoutRef<typeof Toolbar>,
  | 'centerContent'
  | 'className'
  | 'dividers'
  | 'endContent'
  | 'gap'
  | 'label'
  | 'orientation'
  | 'size'
  | 'startContent'
  | 'variant'
>;

export interface AstryxToolbarProps extends AstryxToolbarRootProps {
  label?: string;
  size?: AstryxToolbarSize;
  gap?: AstryxStackGap;
  orientation?: AstryxToolbarOrientation;
  variant?: AstryxSectionVariant;
  dividerTop?: boolean;
  dividerBottom?: boolean;
  dividerStart?: boolean;
  dividerEnd?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxToolbar({
  label = 'Actions',
  size = 'md',
  gap = 1,
  orientation = 'horizontal',
  variant = 'transparent',
  dividerTop = false,
  dividerBottom = false,
  dividerStart = false,
  dividerEnd = false,
  className,
  children,
  ...rootProps
}: AstryxToolbarProps) {
  const slots = collectAstryxToolbarSlots(children);
  const dividers = [
    dividerTop ? 'top' : null,
    dividerBottom ? 'bottom' : null,
    dividerStart ? 'start' : null,
    dividerEnd ? 'end' : null,
  ].filter(Boolean) as Array<'top' | 'bottom' | 'start' | 'end'>;

  return (
    <Toolbar
      {...rootProps}
      centerContent={slots.center}
      className={cx('astryx-wb-toolbar', className)}
      dividers={dividers.length ? dividers : undefined}
      endContent={slots.end}
      gap={resolveAstryxToolbarGap(gap)}
      label={label}
      orientation={orientation}
      size={size}
      startContent={slots.start}
      variant={variant}
    />
  );
}

function collectAstryxToolbarSlots(children: ReactNode): {
  center?: ReactNode;
  end?: ReactNode;
  start?: ReactNode;
} {
  const start: ReactNode[] = [];
  const center: ReactNode[] = [];
  const end: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      start.push(child);
      return;
    }

    if (!isAstryxElementType(child, AstryxToolbarSlot, 'AstryxToolbarSlot')) {
      start.push(child);
      return;
    }

    const slotChild = child as ReactElement<{ slot?: AstryxToolbarSlotPosition }>;
    if (slotChild.props.slot === 'center') {
      center.push(child);
    } else if (slotChild.props.slot === 'end') {
      end.push(child);
    } else {
      start.push(child);
    }
  });

  return {
    center: center.length ? center : undefined,
    end: end.length ? end : undefined,
    start: start.length ? start : undefined,
  };
}

function resolveAstryxToolbarGap(gap: AstryxStackGap): 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 {
  if (typeof gap === 'number') return gap;
  if (gap === 'none') return 0;
  if (gap === 'xs') return 1;
  if (gap === 'sm') return 2;
  if (gap === 'md') return 4;
  if (gap === 'lg') return 6;
  if (gap === 'xl') return 8;
  return 10;
}
