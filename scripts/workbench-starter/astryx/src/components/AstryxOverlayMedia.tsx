import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'img'>, 'alt' | 'className' | 'src'>;

export interface AstryxOverlayMediaProps extends RootProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function AstryxOverlayMedia({
  src = '/workbench-assets/images/album-samples/geometric-cube.png',
  alt = 'Mountain landscape',
  className,
  ...rootProps
}: AstryxOverlayMediaProps) {
  return (
    <img
      {...rootProps}
      alt={alt}
      className={cx('astryx-wb-overlay__media', className)}
      src={src}
    />
  );
}

AstryxOverlayMedia.displayName = 'AstryxOverlayMedia';
