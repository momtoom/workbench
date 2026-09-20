import { Layout } from '@astryxdesign/core/Layout';
import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';
import { cx } from './classNames';
import { AstryxLayoutContent } from './AstryxLayoutContent';
import { AstryxLayoutFooter } from './AstryxLayoutFooter';
import { AstryxLayoutHeader } from './AstryxLayoutHeader';
import { resolveAstryxLayoutPadding, type AstryxLayoutPadding } from './AstryxLayoutHeader';
import { AstryxLayoutPanel } from './AstryxLayoutPanel';
import { isAstryxElementType } from './AstryxWorkbenchChild';

export type AstryxLayoutHeight = 'fill' | 'auto';

type AstryxLayoutRootProps = Omit<
  ComponentPropsWithoutRef<typeof Layout>,
  | 'children'
  | 'className'
  | 'content'
  | 'contentWidth'
  | 'defaultHasDividers'
  | 'end'
  | 'footer'
  | 'header'
  | 'height'
  | 'padding'
  | 'start'
>;

export interface AstryxLayoutProps extends AstryxLayoutRootProps {
  height?: AstryxLayoutHeight;
  padding?: AstryxLayoutPadding;
  contentWidth?: number;
  defaultHasDividers?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxLayout({
  height = 'auto',
  padding = 'none',
  contentWidth,
  defaultHasDividers = true,
  className,
  children,
  ...rootProps
}: AstryxLayoutProps) {
  const slots = collectAstryxLayoutSlots(children);

  return (
    <Layout
      {...rootProps}
      className={cx('astryx-wb-layout', className)}
      content={slots.content}
      contentWidth={contentWidth}
      defaultHasDividers={defaultHasDividers}
      end={slots.end}
      footer={slots.footer}
      header={slots.header}
      height={height}
      padding={resolveAstryxLayoutPadding(padding)}
      start={slots.start}
    />
  );
}

function collectAstryxLayoutSlots(children: ReactNode): {
  content?: ReactNode;
  end?: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  start?: ReactNode;
} {
  const content: ReactNode[] = [];
  let header: ReactNode;
  let footer: ReactNode;
  let start: ReactNode;
  let end: ReactNode;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      content.push(child);
      return;
    }

    if (isAstryxElementType(child, AstryxLayoutHeader, 'AstryxLayoutHeader')) {
      header = child;
      return;
    }

    if (isAstryxElementType(child, AstryxLayoutFooter, 'AstryxLayoutFooter')) {
      footer = child;
      return;
    }

    if (isAstryxElementType(child, AstryxLayoutContent, 'AstryxLayoutContent')) {
      content.push(child);
      return;
    }

    if (isAstryxElementType(child, AstryxLayoutPanel, 'AstryxLayoutPanel')) {
      const panel = child as ReactElement<{ slot?: 'start' | 'end' }>;
      if (panel.props.slot === 'end') {
        end = child;
      } else {
        start = child;
      }
      return;
    }

    content.push(child);
  });

  return {
    content: content.length ? content : undefined,
    end,
    footer,
    header,
    start,
  };
}
