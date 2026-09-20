import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxVisuallyHiddenElement = 'span' | 'div' | 'p';
type RootProps = Omit<ComponentPropsWithoutRef<typeof VisuallyHidden>, 'as' | 'children'>;
export interface AstryxVisuallyHiddenProps extends RootProps {
  children?: string;
  as?: AstryxVisuallyHiddenElement;
  isLiveRegion?: boolean;
}
export function AstryxVisuallyHidden({
  children = 'Additional context for screen readers',
  as = 'span',
  isLiveRegion = false,
  ...rootProps
}: AstryxVisuallyHiddenProps) {
  return (
    <VisuallyHidden {...rootProps} aria-live={isLiveRegion ? 'polite' : undefined} as={as}>
      {children}
    </VisuallyHidden>
  );
}
