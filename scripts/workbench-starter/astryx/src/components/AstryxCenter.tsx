import { Center } from '@astryxdesign/core/Center';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type AstryxCenterAxis = 'both' | 'horizontal' | 'vertical';

type AstryxCenterRootProps = Omit<
  ComponentPropsWithoutRef<typeof Center>,
  'axis' | 'children' | 'className' | 'height' | 'isInline' | 'width'
>;

export interface AstryxCenterProps extends AstryxCenterRootProps {
  axis?: AstryxCenterAxis;
  width?: string;
  height?: string;
  isInline?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxCenter({
  axis = 'both',
  width = '100%',
  height = '',
  isInline = false,
  className,
  children,
  ...rootProps
}: AstryxCenterProps) {
  return (
    <Center
      {...rootProps}
      axis={axis}
      className={className}
      height={height || undefined}
      isInline={isInline}
      width={width || undefined}
    >
      {children}
    </Center>
  );
}
