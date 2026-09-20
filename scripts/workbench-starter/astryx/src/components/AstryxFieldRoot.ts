import type { ComponentPropsWithoutRef, CSSProperties } from 'react';

export function resolveAstryxFieldRootProps(rootProps: object, width: string) {
  const { style, ...rootDomProps } = rootProps as ComponentPropsWithoutRef<'div'>;

  return {
    rootDomProps,
    rootStyle: {
      ...style,
      // An empty width ("inherit") leaves the parent layout and Inspector
      // source styles in charge instead of clearing an authored width.
      ...(width ? { width } : null),
    } satisfies CSSProperties,
  };
}
