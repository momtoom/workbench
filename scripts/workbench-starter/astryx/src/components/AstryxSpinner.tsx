import { Spinner } from '@astryxdesign/core/Spinner';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type AstryxSpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type AstryxSpinnerShade = 'default' | 'onMedia' | 'subtle' | 'inherit';

type AstryxSpinnerRootProps = Omit<ComponentPropsWithoutRef<typeof Spinner>, 'className' | 'label' | 'shade' | 'size'>;

export interface AstryxSpinnerProps extends AstryxSpinnerRootProps {
  label?: ReactNode;
  size?: AstryxSpinnerSize;
  shade?: AstryxSpinnerShade;
  ariaLabel?: string;
  className?: string;
}

export function AstryxSpinner({
  label = 'Loading',
  size = 'md',
  shade = 'default',
  ariaLabel,
  className,
  ...rootProps
}: AstryxSpinnerProps) {
  return (
    <Spinner
      {...rootProps}
      aria-label={ariaLabel || (typeof label === 'string' ? label : 'Loading')}
      className={className}
      label={label}
      shade={shade}
      size={size}
    />
  );
}
