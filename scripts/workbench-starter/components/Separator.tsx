import { Separator as BaseSeparator } from '@base-ui/react/separator';
import type { ComponentProps } from 'react';
import './local.css';

export type SeparatorOrientation = 'horizontal' | 'vertical';

export type SeparatorProps = Omit<ComponentProps<typeof BaseSeparator>, 'className' | 'orientation'> & {
  className?: string;
  decorative?: boolean;
  orientation?: SeparatorOrientation;
};

export function Separator({
  className = '',
  decorative = true,
  orientation = 'horizontal',
  role,
  ...props
}: SeparatorProps) {
  return (
    <BaseSeparator
      {...props}
      aria-hidden={decorative ? true : props['aria-hidden']}
      className={['wb-separator', `wb-separator--${orientation}`, className].filter(Boolean).join(' ')}
      orientation={orientation}
      role={decorative ? 'none' : role}
    />
  );
}
