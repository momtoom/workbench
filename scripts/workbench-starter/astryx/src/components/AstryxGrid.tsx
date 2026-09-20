import { Grid } from '@astryxdesign/core/Grid';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { cx } from './classNames';
import type { AstryxStackGap } from './AstryxStack';

export type AstryxGridAlignment = 'start' | 'center' | 'end' | 'stretch';
export type AstryxGridGap = AstryxStackGap | 'inherit';

type AstryxGridRootProps = Omit<
  ComponentPropsWithoutRef<typeof Grid>,
  | 'align'
  | 'children'
  | 'className'
  | 'columnGap'
  | 'columns'
  | 'gap'
  | 'height'
  | 'justify'
  | 'minChildWidth'
  | 'rowGap'
  | 'rowHeight'
  | 'width'
>;

export interface AstryxGridProps extends AstryxGridRootProps {
  columns?: number;
  minChildWidth?: number;
  gap?: AstryxGridGap;
  rowGap?: AstryxGridGap;
  columnGap?: AstryxGridGap;
  rowHeight?: number;
  align?: AstryxGridAlignment;
  justify?: AstryxGridAlignment;
  width?: string;
  height?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxGrid({
  columns = 3,
  minChildWidth = 0,
  gap = 'md',
  rowGap = 'inherit',
  columnGap = 'inherit',
  rowHeight = 0,
  align = 'stretch',
  justify = 'stretch',
  width = '100%',
  height,
  className,
  children,
  style,
  ...rootProps
}: AstryxGridProps) {
  const resolvedGap = resolveAstryxGridGap(gap);
  const resolvedColumnGap = resolveAstryxGridGap(columnGap);
  const responsiveCappedTemplate = resolveAstryxResponsiveCappedGridTemplate(
    columns,
    minChildWidth,
    resolvedGap,
    resolvedColumnGap,
  );
  const gridStyle = responsiveCappedTemplate
    ? ({
        ...style,
        '--astryx-wb-grid-template-columns': responsiveCappedTemplate,
      } as CSSProperties)
    : style;

  return (
    <Grid
      {...rootProps}
      align={align}
      className={cx('astryx-wb-grid', className)}
      columnGap={resolvedColumnGap}
      columns={columns}
      data-astryx-wb-grid-responsive-cap={responsiveCappedTemplate ? 'true' : undefined}
      gap={resolvedGap}
      height={height || undefined}
      justify={justify}
      minChildWidth={minChildWidth}
      rowGap={resolveAstryxGridGap(rowGap)}
      rowHeight={rowHeight > 0 ? rowHeight : undefined}
      style={gridStyle}
      width={width || undefined}
    >
      {children}
    </Grid>
  );
}

function resolveAstryxGridGap(gap: AstryxGridGap): 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | undefined {
  if (gap === 'inherit') return undefined;
  if (typeof gap === 'number') return gap;
  if (gap === 'none') return 0;
  if (gap === 'xs') return 1;
  if (gap === 'sm') return 2;
  if (gap === 'md') return 4;
  if (gap === 'lg') return 6;
  if (gap === 'xl') return 8;
  return 10;
}

type AstryxResolvedGridGap = ReturnType<typeof resolveAstryxGridGap>;

function resolveAstryxResponsiveCappedGridTemplate(
  columns: number,
  minChildWidth: number,
  gap: AstryxResolvedGridGap,
  columnGap: AstryxResolvedGridGap,
): string | undefined {
  if (!Number.isFinite(columns) || columns <= 1) return undefined;
  if (!Number.isFinite(minChildWidth) || minChildWidth <= 0) return undefined;

  const maxColumns = Math.max(1, Math.floor(columns));
  const gapValue = getAstryxGridGapValue(columnGap ?? gap);
  const cappedMinimum = `max(${minChildWidth}px, calc((100% - ${maxColumns - 1} * ${gapValue}) / ${maxColumns}))`;
  return `repeat(auto-fit, minmax(min(100%, ${cappedMinimum}), 1fr))`;
}

function getAstryxGridGapValue(gap: AstryxResolvedGridGap): string {
  if (gap == null || gap === 0) return '0px';
  return `var(--spacing-${String(gap).replace('.', '-')})`;
}
