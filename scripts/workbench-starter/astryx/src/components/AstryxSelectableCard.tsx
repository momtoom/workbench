import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxSelectableCardPadding = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
export type AstryxSelectableCardVariant =
  | 'blue'
  | 'cyan'
  | 'default'
  | 'gray'
  | 'green'
  | 'muted'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'red'
  | 'teal'
  | 'transparent'
  | 'yellow';

type AstryxSelectableCardRootProps = Omit<
  ComponentPropsWithoutRef<typeof SelectableCard>,
  | 'children'
  | 'className'
  | 'height'
  | 'isDisabled'
  | 'isSelected'
  | 'label'
  | 'maxWidth'
  | 'onChange'
  | 'padding'
  | 'variant'
  | 'width'
>;

export interface AstryxSelectableCardProps extends AstryxSelectableCardRootProps {
  label?: string;
  defaultSelected?: boolean;
  isDisabled?: boolean;
  padding?: AstryxSelectableCardPadding;
  variant?: AstryxSelectableCardVariant;
  width?: string;
  height?: string;
  maxWidth?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxSelectableCard({
  label = 'Selectable card',
  defaultSelected = true,
  isDisabled = false,
  padding = 4,
  variant = 'default',
  width = '100%',
  height,
  maxWidth = '360px',
  className,
  children,
  ...rootProps
}: AstryxSelectableCardProps) {
  const [isSelected, setIsSelected] = useState(defaultSelected);

  useEffect(() => {
    setIsSelected(defaultSelected);
  }, [defaultSelected]);

  return (
    <SelectableCard
      {...rootProps}
      className={cx('astryx-wb-selectable-card', className)}
      height={height || undefined}
      isDisabled={isDisabled}
      isSelected={isSelected}
      label={label}
      maxWidth={resolveSize(maxWidth)}
      onChange={setIsSelected}
      padding={padding}
      variant={variant}
      width={resolveSize(width)}
    >
      {children}
    </SelectableCard>
  );
}

function resolveSize(value: string): string | undefined {
  if (!value) return undefined;
  if (value === 'full') return '100%';
  if (value === 'fit') return 'fit-content';
  return value;
}
