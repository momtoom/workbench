import { Citation } from '@astryxdesign/core/Citation';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxCitationVariant = 'label' | 'number';

type AstryxCitationRootProps = Omit<
  ComponentPropsWithoutRef<typeof Citation>,
  'className' | 'number' | 'source' | 'variant'
>;

export interface AstryxCitationProps extends AstryxCitationRootProps {
  title?: string;
  url?: string;
  icon?: string;
  number?: number;
  variant?: AstryxCitationVariant;
  className?: string;
}

export function AstryxCitation({
  title = 'Astryx documentation',
  url = '',
  icon = '',
  number = 1,
  variant = 'label',
  className,
  ...rootProps
}: AstryxCitationProps) {
  return (
    <Citation
      {...rootProps}
      className={className}
      number={number}
      source={{
        title,
        url: url || undefined,
        icon: icon || undefined,
      }}
      variant={variant}
    />
  );
}
