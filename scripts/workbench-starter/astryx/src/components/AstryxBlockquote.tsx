import { Blockquote } from '@astryxdesign/core/Blockquote';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AstryxBlockquoteRootProps = Omit<ComponentPropsWithoutRef<typeof Blockquote>, 'children' | 'cite' | 'className'>;

export interface AstryxBlockquoteProps extends AstryxBlockquoteRootProps {
  children?: ReactNode;
  cite?: string;
  className?: string;
}

export function AstryxBlockquote({
  children = 'Design systems work best when intent remains visible in source.',
  cite = 'Workbench note',
  className,
  ...rootProps
}: AstryxBlockquoteProps) {
  return (
    <Blockquote {...rootProps} cite={cite || undefined} className={className}>
      {children}
    </Blockquote>
  );
}
