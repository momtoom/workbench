import { ButtonGroup } from '@astryxdesign/core/ButtonGroup';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxButton, type AstryxButtonSize, type AstryxButtonVariant } from './AstryxButton';
import { cx } from './classNames';

export type AstryxButtonGroupOrientation = 'horizontal' | 'vertical';

type AstryxButtonGroupRootProps = Omit<
  ComponentPropsWithoutRef<typeof ButtonGroup>,
  'children' | 'className' | 'isDisabled' | 'label' | 'orientation' | 'size'
>;

export interface AstryxButtonGroupProps extends AstryxButtonGroupRootProps {
  label?: string;
  children?: ReactNode;
  firstLabel?: string;
  secondLabel?: string;
  thirdLabel?: string;
  variant?: AstryxButtonVariant;
  size?: AstryxButtonSize;
  orientation?: AstryxButtonGroupOrientation;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxButtonGroup({
  label = 'Grouped actions',
  children,
  firstLabel = 'Copy',
  secondLabel = 'Cut',
  thirdLabel = 'Paste',
  variant = 'secondary',
  size = 'md',
  orientation = 'horizontal',
  isDisabled = false,
  className,
  ...rootProps
}: AstryxButtonGroupProps) {
  return (
    <ButtonGroup
      {...rootProps}
      className={cx('astryx-wb-button-group', className)}
      isDisabled={isDisabled}
      label={label}
      orientation={orientation}
      size={size}
    >
      {children ?? (
        <>
          <AstryxButton isDisabled={isDisabled} label={firstLabel} variant={variant} />
          <AstryxButton isDisabled={isDisabled} label={secondLabel} variant={variant} />
          <AstryxButton isDisabled={isDisabled} label={thirdLabel} variant={variant} />
        </>
      )}
    </ButtonGroup>
  );
}
