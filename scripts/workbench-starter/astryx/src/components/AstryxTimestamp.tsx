import { Timestamp } from '@astryxdesign/core/Timestamp';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import type { AstryxTextColor, AstryxTextCoreSize, AstryxTextType, AstryxTextWeight } from './AstryxText';

export type AstryxTimestampFormat =
  | 'relative'
  | 'auto'
  | 'date'
  | 'date_time'
  | 'time'
  | 'system_date'
  | 'system_date_time'
  | 'system_time';

type AstryxTimestampRootProps = Omit<
  ComponentPropsWithoutRef<typeof Timestamp>,
  | 'autoThreshold'
  | 'className'
  | 'color'
  | 'format'
  | 'hasTooltip'
  | 'isLive'
  | 'isTimezoneShown'
  | 'size'
  | 'type'
  | 'value'
  | 'weight'
>;

export interface AstryxTimestampProps extends AstryxTimestampRootProps {
  value?: string;
  format?: AstryxTimestampFormat;
  autoThreshold?: number;
  hasTooltip?: boolean;
  isTimezoneShown?: boolean;
  isLive?: boolean;
  type?: AstryxTextType;
  size?: AstryxTextCoreSize;
  color?: AstryxTextColor;
  weight?: AstryxTextWeight;
  className?: string;
}

export function AstryxTimestamp({
  value = '2026-07-04T09:00:00Z',
  format = 'date_time',
  autoThreshold = 604800,
  hasTooltip = true,
  isTimezoneShown = false,
  isLive = false,
  type = 'supporting',
  size,
  color = 'secondary',
  weight,
  className,
  style,
  ...rootProps
}: AstryxTimestampProps) {
  const timestampSize = getAstryxTimestampSize(size);
  const staticColor = getAstryxTimestampStaticColorValue(color);
  const resolvedStyle = staticColor
    ? ({ ...style, color: staticColor } satisfies CSSProperties)
    : style;

  return (
    <Timestamp
      {...rootProps}
      autoThreshold={autoThreshold}
      className={className}
      color={getAstryxTimestampCoreColor(color)}
      format={format}
      hasTooltip={hasTooltip}
      isLive={isLive}
      isTimezoneShown={isTimezoneShown}
      size={timestampSize}
      style={resolvedStyle}
      type={type}
      value={value}
      weight={weight}
    />
  );
}

function getAstryxTimestampSize(size: AstryxTextCoreSize | undefined): Exclude<AstryxTextCoreSize, 'xs'> | undefined {
  if (!size) return undefined;
  return size === 'xs' ? 'xsm' : size;
}

function getAstryxTimestampCoreColor(
  color: AstryxTextColor,
): Exclude<AstryxTextColor, 'inverted' | 'static-light' | 'static-dark'> {
  return color === 'inverted' || color === 'static-light' || color === 'static-dark' ? 'inherit' : color;
}

function getAstryxTimestampStaticColorValue(color: AstryxTextColor): string | undefined {
  if (color === 'inverted') return 'light-dark(var(--color-on-light), var(--color-on-dark))';
  if (color === 'static-light') return 'var(--color-on-light)';
  if (color === 'static-dark') return 'var(--color-on-dark)';
  return undefined;
}
