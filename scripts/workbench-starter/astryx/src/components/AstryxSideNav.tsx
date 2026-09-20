import { SideNav } from '@astryxdesign/core/SideNav';
import {
  Children,
  isValidElement,
  useLayoutEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './classNames';
import { AstryxSideNavCollapseButton } from './AstryxSideNavCollapseButton';
import { AstryxSideNavHeading } from './AstryxSideNavHeading';
import { AstryxSideNavSlot, type AstryxSideNavSlotPosition } from './AstryxSideNavSlot';
import { isAstryxElementType } from './AstryxWorkbenchChild';

type AstryxSideNavRootProps = Omit<
  ComponentPropsWithoutRef<typeof SideNav>,
  'children' | 'className' | 'collapsible' | 'footer' | 'footerIcons' | 'header' | 'resizable' | 'topContent'
>;

export interface AstryxSideNavProps extends AstryxSideNavRootProps {
  collapsible?: boolean;
  defaultIsCollapsed?: boolean;
  hasCollapseButton?: boolean;
  collapseButtonLabel?: string;
  resizable?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxSideNav({
  collapsible = false,
  defaultIsCollapsed = false,
  hasCollapseButton = true,
  collapseButtonLabel = 'Toggle navigation',
  resizable = false,
  className,
  children,
  ...rootProps
}: AstryxSideNavProps) {
  const slots = collectAstryxSideNavSlots(children);
  const hasAuthoredCollapseButton = containsAstryxSideNavCollapseButton(children);
  const [sideNavElement, setSideNavElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const layout = sideNavElement?.closest<HTMLElement>('[data-astryx-wb-side-nav-layout]');
    if (!sideNavElement || !layout || typeof ResizeObserver === 'undefined') return;

    const publishWidth = () => {
      layout.style.setProperty('--astryx-wb-side-nav-width', `${sideNavElement.getBoundingClientRect().width}px`);
    };
    const observer = new ResizeObserver(publishWidth);

    observer.observe(sideNavElement, { box: 'border-box' });
    publishWidth();

    return () => observer.disconnect();
  }, [sideNavElement]);

  return (
    <SideNav
      {...rootProps}
      ref={setSideNavElement}
      className={cx('astryx-wb-side-nav', className)}
      collapsible={
        collapsible
          ? {
              buttonLabel: collapseButtonLabel,
              defaultIsCollapsed,
              hasButton: hasCollapseButton && !hasAuthoredCollapseButton,
            }
          : false
      }
      footer={slots.footer}
      footerIcons={slots.footerIcons}
      header={slots.header}
      resizable={resizable}
	      topContent={slots.topContent}
	    >
	      {slots.children ? <div className="astryx-wb-side-nav-content">{slots.children}</div> : undefined}
	    </SideNav>
	  );
	}

function containsAstryxSideNavCollapseButton(children: ReactNode): boolean {
  let contains = false;

  Children.forEach(children, (child) => {
    if (contains || !isValidElement(child)) return;
    if (isAstryxElementType(child, AstryxSideNavCollapseButton, 'AstryxSideNavCollapseButton')) {
      contains = true;
      return;
    }

    const childProps = child.props as { children?: ReactNode };
    if (childProps.children && containsAstryxSideNavCollapseButton(childProps.children)) {
      contains = true;
    }
  });

  return contains;
}

function collectAstryxSideNavSlots(children: ReactNode): {
  children?: ReactNode;
  footer?: ReactNode;
  footerIcons?: ReactNode;
  header?: ReactNode;
  topContent?: ReactNode;
} {
  const navChildren: ReactNode[] = [];
  const topContent: ReactNode[] = [];
  const footer: ReactNode[] = [];
  const footerIcons: ReactNode[] = [];
  let header: ReactNode;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      navChildren.push(child);
      return;
    }

    if (isAstryxElementType(child, AstryxSideNavHeading, 'AstryxSideNavHeading')) {
      header = child;
      return;
    }

    if (isAstryxElementType(child, AstryxSideNavSlot, 'AstryxSideNavSlot')) {
      const slotChild = child as ReactElement<{ slot?: AstryxSideNavSlotPosition }>;
      if (slotChild.props.slot === 'footer') {
        footer.push(child);
      } else if (slotChild.props.slot === 'footerIcons') {
        footerIcons.push(child);
      } else {
        topContent.push(child);
      }
      return;
    }

    navChildren.push(child);
  });

  return {
    children: navChildren.length ? navChildren : undefined,
    footer: footer.length ? footer : undefined,
    footerIcons: footerIcons.length ? footerIcons : undefined,
    header,
    topContent: topContent.length ? topContent : undefined,
  };
}
