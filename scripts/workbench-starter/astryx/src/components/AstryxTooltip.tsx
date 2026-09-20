import { Tooltip } from '@astryxdesign/core/Tooltip';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxButton } from './AstryxButton';
import { cx } from './classNames';

export type AstryxTooltipPlacement = 'above' | 'below' | 'start' | 'end';
export type AstryxTooltipAlignment = 'start' | 'center' | 'end';
export type AstryxTooltipFocusTrigger = 'auto' | 'always' | 'never';
export type AstryxTooltipHoverIndication = 'auto' | 'true' | 'false';

type AstryxTooltipRootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>;

export interface AstryxTooltipProps extends AstryxTooltipRootProps {
  content?: string;
  placement?: AstryxTooltipPlacement;
  alignment?: AstryxTooltipAlignment;
  delay?: number;
  hideDelay?: number;
  focusTrigger?: AstryxTooltipFocusTrigger;
  isEnabled?: boolean;
  isDefaultOpen?: boolean;
  hasHoverIndication?: AstryxTooltipHoverIndication;
  className?: string;
  children?: ReactNode;
}

export function AstryxTooltip({
  content = 'Helpful context',
  placement = 'above',
  alignment = 'center',
  delay = 200,
  hideDelay = 0,
  focusTrigger = 'auto',
  isEnabled = true,
  isDefaultOpen = false,
  hasHoverIndication = 'auto',
  className,
  children,
  ...rootProps
}: AstryxTooltipProps) {
  return (
    <span {...rootProps} className={cx('astryx-wb-tooltip', className)}>
      <Tooltip
        alignment={alignment}
        content={content}
        delay={delay}
        focusTrigger={focusTrigger}
        hasHoverIndication={resolveHoverIndication(hasHoverIndication)}
        hideDelay={hideDelay}
        isDefaultOpen={isDefaultOpen}
        isEnabled={isEnabled}
        placement={placement}
      >
        {children || <AstryxButton label="Hover for tooltip" />}
      </Tooltip>
    </span>
  );
}

function resolveHoverIndication(value: AstryxTooltipHoverIndication): 'auto' | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return 'auto';
}
