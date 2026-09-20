import { Kbd } from '@astryxdesign/core/Kbd';
import type { ComponentPropsWithoutRef } from 'react';

type AstryxKbdRootProps = Omit<ComponentPropsWithoutRef<typeof Kbd>, 'className' | 'keys'>;

export interface AstryxKbdProps extends AstryxKbdRootProps {
  keys?: string;
  className?: string;
}

export function AstryxKbd({ keys = 'mod+k', className, ...rootProps }: AstryxKbdProps) {
  return <Kbd {...rootProps} className={className} keys={keys} />;
}
