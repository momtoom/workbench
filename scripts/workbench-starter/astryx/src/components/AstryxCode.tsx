import { Code } from '@astryxdesign/core/Code';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AstryxCodeRootProps = Omit<ComponentPropsWithoutRef<typeof Code>, 'children' | 'className'>;

export interface AstryxCodeProps extends AstryxCodeRootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxCode({ children = 'const value = true', className, ...rootProps }: AstryxCodeProps) {
  return (
    <Code {...rootProps} className={className}>
      {children}
    </Code>
  );
}
