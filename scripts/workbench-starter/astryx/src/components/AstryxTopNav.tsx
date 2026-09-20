import { TopNav } from '@astryxdesign/core/TopNav';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';
import { cx } from './classNames';
import { AstryxTopNavHeading } from './AstryxTopNavHeading';
import { AstryxTopNavSlot, type AstryxTopNavSlotPosition } from './AstryxTopNavSlot';
import { isAstryxElementType } from './AstryxWorkbenchChild';

type AstryxTopNavRootProps = Omit<
  ComponentPropsWithoutRef<typeof TopNav>,
  'centerContent' | 'children' | 'className' | 'endContent' | 'heading' | 'label' | 'startContent'
>;

export interface AstryxTopNavProps extends AstryxTopNavRootProps {
  label?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxTopNav({
  label = 'Primary navigation',
  className,
  children,
  ...rootProps
}: AstryxTopNavProps) {
  const slots = collectAstryxTopNavSlots(children);

  return (
    <TopNav
      {...rootProps}
      centerContent={slots.center}
      className={cx('astryx-wb-top-nav', className)}
      endContent={slots.end}
      heading={slots.heading}
      label={label}
      startContent={slots.start}
    />
  );
}

function collectAstryxTopNavSlots(children: ReactNode): {
  center?: ReactNode;
  end?: ReactNode;
  heading?: ReactNode;
  start?: ReactNode;
} {
  const start: ReactNode[] = [];
  const center: ReactNode[] = [];
  const end: ReactNode[] = [];
  let heading: ReactNode;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      start.push(child);
      return;
    }

    if (isAstryxElementType(child, AstryxTopNavHeading, 'AstryxTopNavHeading')) {
      heading = child;
      return;
    }

    if (isAstryxElementType(child, AstryxTopNavSlot, 'AstryxTopNavSlot')) {
      const slotChild = child as ReactElement<{ slot?: AstryxTopNavSlotPosition }>;
      if (slotChild.props.slot === 'center') {
        center.push(child);
      } else if (slotChild.props.slot === 'end') {
        end.push(child);
      } else {
        start.push(child);
      }
      return;
    }

    start.push(child);
  });

  return {
    center: center.length ? center : undefined,
    end: end.length ? end : undefined,
    heading,
    start: start.length ? start : undefined,
  };
}
