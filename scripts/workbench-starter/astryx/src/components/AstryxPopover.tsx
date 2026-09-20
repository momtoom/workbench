import { Popover } from '@astryxdesign/core/Popover';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AstryxButton } from './AstryxButton';
import { AstryxPopoverContent } from './AstryxPopoverContent';
import { AstryxPopoverTrigger } from './AstryxPopoverTrigger';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

export type AstryxPopoverPlacement = 'above' | 'below' | 'start' | 'end';
export type AstryxPopoverAlignment = 'start' | 'center' | 'end';

type AstryxPopoverRootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>;

export interface AstryxPopoverProps extends AstryxPopoverRootProps {
  label?: string;
  placement?: AstryxPopoverPlacement;
  alignment?: AstryxPopoverAlignment;
  width?: string;
  isEnabled?: boolean;
  isDefaultOpen?: boolean;
  hasCloseButton?: boolean;
  hasAutoFocus?: boolean;
  closeButtonLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxPopover({
  label = 'Popover',
  placement = 'below',
  alignment = 'start',
  width = '280px',
  isEnabled = true,
  isDefaultOpen = false,
  hasCloseButton = true,
  hasAutoFocus = false,
  closeButtonLabel = 'Close popover',
  className,
  children,
  ...rootProps
}: AstryxPopoverProps) {
  const slots = collectAstryxPopoverSlots(children);

  return (
    <span {...rootProps} className={cx('astryx-wb-popover', className)}>
      <Popover
        alignment={alignment}
        className="astryx-wb-popover-layer"
        closeButtonLabel={closeButtonLabel}
        content={slots.content}
        hasAutoFocus={hasAutoFocus}
        hasCloseButton={hasCloseButton}
        isEnabled={isEnabled}
        isOpen={isDefaultOpen || undefined}
        label={label}
        placement={placement}
        width={resolveOverlayWidth(width)}
      >
        {slots.trigger}
      </Popover>
    </span>
  );
}

function collectAstryxPopoverSlots(children: ReactNode): { content: ReactNode; trigger: ReactNode } {
  let trigger: ReactNode;
  let content: ReactNode;
  const fallback: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      fallback.push(child);
      return;
    }
    if (isAstryxElementType(child, AstryxPopoverTrigger, 'AstryxPopoverTrigger')) {
      trigger = child;
      return;
    }
    if (isAstryxElementType(child, AstryxPopoverContent, 'AstryxPopoverContent')) {
      content = child;
      return;
    }
    fallback.push(child);
  });

  return {
    content: content || fallback,
    trigger: trigger || <AstryxButton label="Open popover" />,
  };
}

function resolveOverlayWidth(width: string): string | number {
  const numeric = Number(width);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : width;
}
