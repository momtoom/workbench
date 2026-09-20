import { Card } from '@astryxdesign/core/Card';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxCardVariant =
  | 'default'
  | 'transparent'
  | 'subtle'
  | 'muted'
  | 'blue'
  | 'cyan'
  | 'gray'
  | 'green'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'red'
  | 'teal'
  | 'yellow';
export type AstryxCardPadding =
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 3
  | 4
  | 5
  | 6
  | 8
  | 10
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl';

type AstryxCardRootProps = Omit<
  ComponentPropsWithoutRef<typeof Card>,
  'children' | 'className' | 'height' | 'maxWidth' | 'minHeight' | 'padding' | 'variant' | 'width'
>;

export interface AstryxCardProps extends AstryxCardRootProps {
  variant?: AstryxCardVariant;
  backgroundColor?: string;
  padding?: AstryxCardPadding;
  width?: string;
  maxWidth?: string;
  minHeight?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxCard({
  variant = 'default',
  backgroundColor,
  padding = 'md',
  width,
  maxWidth,
  minHeight,
  className,
  children,
  ...rootProps
}: AstryxCardProps) {
  const resolvedVariant = resolveAstryxCardVariant(variant);
  const hasExplicitBorder = hasExplicitCardBorder(className, rootProps.style);
  const { cardClassName, frameClassName } = splitCardClassName(className);
  const { cardStyle, frameAppearanceStyle } = splitCardStyle(rootProps.style);
  const resolvedCardStyle = {
    ...(variant === 'subtle'
      ? { backgroundColor: 'var(--color-background-surface)' }
      : null),
    ...cardStyle,
    ...(backgroundColor ? { backgroundColor } : null),
  } satisfies CSSProperties;
  const frameStyle = {
    width,
    maxWidth,
    minHeight,
    ...frameAppearanceStyle,
  } satisfies CSSProperties;

  return (
    <div
      className={cx('astryx-wb-card-frame', frameClassName)}
      data-astryx-wb-card-explicit-border={hasExplicitBorder ? 'true' : undefined}
      data-astryx-wb-card-variant={variant}
      style={frameStyle}
    >
      <Card
        {...rootProps}
        className={cx('astryx-wb-card', cardClassName)}
        minHeight={minHeight}
        padding={resolveAstryxCardPadding(padding)}
        style={resolvedCardStyle}
        variant={resolvedVariant}
        width="100%"
      >
        {children}
      </Card>
    </div>
  );
}

function resolveAstryxCardPadding(padding: AstryxCardPadding): 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 {
  if (typeof padding === 'number') return padding;
  if (padding === 'none') return 0;
  if (padding === 'xs') return 2;
  if (padding === 'sm') return 3;
  if (padding === 'md') return 5;
  if (padding === 'lg') return 6;
  if (padding === 'xl') return 8;
  return 10;
}

function resolveAstryxCardVariant(variant: AstryxCardVariant) {
  return variant === 'subtle' ? 'muted' : variant;
}

function hasExplicitCardBorder(className: string | undefined, style: CSSProperties | undefined) {
  const hasBorderStyle = Object.keys(style ?? {}).some(
    (property) => property.startsWith('border') && !property.includes('Radius'),
  );
  if (hasBorderStyle) return true;

  return className?.split(/\s+/).some((token) => {
    const parts = token.split(':');
    const utility = parts[parts.length - 1]?.replace(/^!/, '');
    return utility === 'border' || utility?.startsWith('border-');
  }) ?? false;
}

function splitCardClassName(className: string | undefined) {
  const cardTokens: string[] = [];
  const frameTokens: string[] = [];

  for (const token of className?.split(/\s+/).filter(Boolean) ?? []) {
    const parts = token.split(':');
    const utility = parts[parts.length - 1]?.replace(/^!/, '');
    const belongsToFrame = isCardFrameUtility(utility);
    const isSharedProjectClass = utility?.startsWith('astryx-') ?? false;

    if (!belongsToFrame || isSharedProjectClass) cardTokens.push(token);
    if (belongsToFrame || isSharedProjectClass) frameTokens.push(token);
  }

  return {
    cardClassName: cardTokens.join(' '),
    frameClassName: frameTokens.join(' '),
  };
}

function isCardFrameUtility(utility: string | undefined) {
  if (!utility) return false;

  const normalizedUtility = utility.replace(/^-/, '');
  if (
    normalizedUtility === 'border'
    || normalizedUtility.startsWith('border-')
    || normalizedUtility === 'rounded'
    || normalizedUtility.startsWith('rounded-')
  ) {
    return true;
  }

  if (
    ['static', 'fixed', 'absolute', 'relative', 'sticky', 'hidden'].includes(normalizedUtility)
    || ['grow', 'shrink'].includes(normalizedUtility)
    || normalizedUtility.startsWith('grow-')
    || normalizedUtility.startsWith('shrink-')
  ) {
    return true;
  }

  return [
    'w-',
    'min-w-',
    'max-w-',
    'h-',
    'min-h-',
    'max-h-',
    'size-',
    'm-',
    'mx-',
    'my-',
    'ms-',
    'me-',
    'mt-',
    'mr-',
    'mb-',
    'ml-',
    'inset-',
    'inset-x-',
    'inset-y-',
    'start-',
    'end-',
    'top-',
    'right-',
    'bottom-',
    'left-',
    'z-',
    'basis-',
    'self-',
    'order-',
    'col-',
    'row-',
    'place-self-',
    'justify-self-',
  ].some((prefix) => normalizedUtility.startsWith(prefix));
}

function splitCardStyle(style: CSSProperties | undefined) {
  const cardStyle: CSSProperties = {};
  const frameAppearanceStyle: CSSProperties = {};

  for (const [property, value] of Object.entries(style ?? {})) {
    const target = isCardFrameStyleProperty(property) ? frameAppearanceStyle : cardStyle;
    (target as Record<string, unknown>)[property] = value;
  }

  return { cardStyle, frameAppearanceStyle };
}

function isCardFrameStyleProperty(property: string) {
  return property.startsWith('border')
    || property.startsWith('margin')
    || property.startsWith('inset')
    || property.startsWith('flex')
    || property.startsWith('gridColumn')
    || property.startsWith('gridRow')
    || [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'zIndex',
      'width',
      'minWidth',
      'maxWidth',
      'height',
      'minHeight',
      'maxHeight',
      'alignSelf',
      'justifySelf',
      'placeSelf',
      'order',
    ].includes(property);
}
