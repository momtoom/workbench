import { SideNavSection } from '@astryxdesign/core/SideNav';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxSideNavSectionRootProps = Omit<
  ComponentPropsWithoutRef<typeof SideNavSection>,
  'children' | 'className' | 'endContent' | 'isHeaderHidden' | 'subtitle' | 'title'
>;

export interface AstryxSideNavSectionProps extends AstryxSideNavSectionRootProps {
  title?: string;
  subtitle?: string;
  endLabel?: string;
  isHeaderHidden?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxSideNavSection({
  title = 'Main',
  subtitle,
  endLabel,
  isHeaderHidden = false,
  className,
  children,
  ...rootProps
}: AstryxSideNavSectionProps) {
  return (
    <SideNavSection
      {...rootProps}
      className={cx('astryx-wb-side-nav-section', className)}
      endContent={endLabel || undefined}
      isHeaderHidden={isHeaderHidden}
      subtitle={subtitle || undefined}
      title={title}
    >
      {children}
    </SideNavSection>
  );
}

AstryxSideNavSection.displayName = 'AstryxSideNavSection';
