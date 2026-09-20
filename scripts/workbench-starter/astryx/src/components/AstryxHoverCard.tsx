import { HoverCard } from '@astryxdesign/core/HoverCard';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AstryxButton } from './AstryxButton';
import { AstryxHoverCardContent } from './AstryxHoverCardContent';
import { AstryxHoverCardTrigger } from './AstryxHoverCardTrigger';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

export type AstryxHoverCardPlacement = 'above' | 'below' | 'start' | 'end';
export type AstryxHoverCardAlignment = 'start' | 'center' | 'end';
export type AstryxHoverCardFocusTrigger = 'auto' | 'always' | 'never';
export type AstryxHoverIndication = 'auto' | 'true' | 'false';

type AstryxHoverCardRootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>;

export interface AstryxHoverCardProps extends AstryxHoverCardRootProps {
  placement?: AstryxHoverCardPlacement;
  alignment?: AstryxHoverCardAlignment;
  delay?: number;
  hideDelay?: number;
  focusTrigger?: AstryxHoverCardFocusTrigger;
  isEnabled?: boolean;
  isDefaultOpen?: boolean;
  hasHoverIndication?: AstryxHoverIndication;
  className?: string;
  children?: ReactNode;
}

export function AstryxHoverCard({
  placement = 'above',
  alignment = 'center',
  delay = 300,
  hideDelay = 200,
  focusTrigger = 'auto',
  isEnabled = true,
  isDefaultOpen = false,
  hasHoverIndication = 'auto',
  className,
  children,
  ...rootProps
}: AstryxHoverCardProps) {
  const slots = collectAstryxHoverCardSlots(children);

  return (
    <span {...rootProps} className={cx('astryx-wb-hover-card', className)}>
      <HoverCard
        alignment={alignment}
        className="astryx-wb-hover-card-layer"
        content={slots.content}
        delay={delay}
        focusTrigger={focusTrigger}
        hasHoverIndication={resolveHoverIndication(hasHoverIndication)}
        hideDelay={hideDelay}
        isDefaultOpen={isDefaultOpen}
        isEnabled={isEnabled}
        placement={placement}
      >
        {slots.trigger}
      </HoverCard>
    </span>
  );
}

function collectAstryxHoverCardSlots(children: ReactNode): { content: ReactNode; trigger: ReactNode } {
  let trigger: ReactNode;
  let content: ReactNode;
  const fallback: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      fallback.push(child);
      return;
    }
    if (isAstryxElementType(child, AstryxHoverCardTrigger, 'AstryxHoverCardTrigger')) {
      trigger = child;
      return;
    }
    if (isAstryxElementType(child, AstryxHoverCardContent, 'AstryxHoverCardContent')) {
      content = child;
      return;
    }
    fallback.push(child);
  });

  return {
    content: content || fallback,
    trigger: trigger || <AstryxButton label="Hover card" />,
  };
}

function resolveHoverIndication(value: AstryxHoverIndication): 'auto' | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return 'auto';
}
