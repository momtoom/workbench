import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxDivider } from './AstryxDivider';
import { cx } from './classNames';

type AstryxSelectorSectionRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className' | 'title'
>;

export interface AstryxSelectorSectionProps extends AstryxSelectorSectionRootProps {
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxSelectorSection({
  title = 'Section',
  className,
  children,
  ...rootProps
}: AstryxSelectorSectionProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-selector-section', className)}
      role="group"
      aria-label={title || undefined}
    >
      {title ? <AstryxDivider label={title} /> : null}
      {children}
    </div>
  );
}

AstryxSelectorSection.displayName = 'AstryxSelectorSection';
