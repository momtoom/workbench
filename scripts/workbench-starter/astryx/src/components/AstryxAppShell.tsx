import { AppShell } from '@astryxdesign/core/AppShell';
import { Children, isValidElement, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react';
import { cx } from './classNames';
import { AstryxSideNav } from './AstryxSideNav';
import { AstryxTopNav } from './AstryxTopNav';
import { isAstryxElementType } from './AstryxWorkbenchChild';

type AstryxAppShellStyle = CSSProperties & Record<`--${string}`, string | number>;

const APP_SHELL_CONTAINER_RESET_STYLE: AstryxAppShellStyle = {
  '--container-padding-inline-start': '0px',
  '--container-padding-inline-end': '0px',
  '--container-padding-block-start': '0px',
  '--container-padding-block-end': '0px',
};

export type AstryxAppShellVariant = 'wash' | 'surface' | 'section' | 'elevated';
export type AstryxAppShellHeight = 'fill' | 'auto';

type AstryxAppShellRootProps = Omit<
  ComponentPropsWithoutRef<typeof AppShell>,
  | 'banner'
  | 'children'
  | 'className'
  | 'contentPadding'
  | 'height'
  | 'mobileNav'
  | 'sideNav'
  | 'style'
  | 'topNav'
  | 'variant'
>;

export interface AstryxAppShellProps extends AstryxAppShellRootProps {
  variant?: AstryxAppShellVariant;
  height?: AstryxAppShellHeight;
  contentPadding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  frameHeight?: number;
  hasMobileNav?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function AstryxAppShell({
  variant = 'section',
  height = 'auto',
  contentPadding = 4,
  frameHeight = 0,
  hasMobileNav = false,
  className,
  style,
  children,
  ...rootProps
}: AstryxAppShellProps) {
  const slots = collectAstryxAppShellSlots(children);
  const resolvedStyle = {
    ...APP_SHELL_CONTAINER_RESET_STYLE,
    ...style,
    ...(frameHeight > 0 ? { height: frameHeight, minHeight: 0, overflow: 'hidden' } : null),
  } satisfies CSSProperties;

  return (
    <AppShell
      {...rootProps}
      className={cx('astryx-wb-app-shell', className)}
      contentPadding={contentPadding}
      height={height}
      mobileNav={hasMobileNav ? undefined : false}
      sideNav={slots.sideNav}
      style={resolvedStyle}
      topNav={slots.topNav}
      variant={variant}
    >
      {slots.content}
    </AppShell>
  );
}

function collectAstryxAppShellSlots(children: ReactNode): {
  content?: ReactNode;
  sideNav?: ReactNode;
  topNav?: ReactNode;
} {
  const content: ReactNode[] = [];
  let sideNav: ReactNode;
  let topNav: ReactNode;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      content.push(child);
      return;
    }

    if (isAstryxElementType(child, AstryxTopNav, 'AstryxTopNav')) {
      topNav = child;
      return;
    }

    if (isAstryxElementType(child, AstryxSideNav, 'AstryxSideNav')) {
      sideNav = child;
      return;
    }

    content.push(child);
  });

  return {
    content: content.length ? content : undefined,
    sideNav,
    topNav,
  };
}
