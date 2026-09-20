import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxAspectRatioPreset = '1:1' | '4:3' | '16:9' | '21:9';
export type AstryxAspectRatioShape = 'rectangle' | 'ellipse';

type AstryxAspectRatioRootProps = Omit<ComponentPropsWithoutRef<typeof AspectRatio>, 'children' | 'className' | 'ratio' | 'shape'>;

export interface AstryxAspectRatioProps extends AstryxAspectRatioRootProps {
  preset?: AstryxAspectRatioPreset;
  label?: string;
  shape?: AstryxAspectRatioShape;
  children?: ReactNode;
  className?: string;
}

export function AstryxAspectRatio({
  preset = '16:9',
  label = '16:9 media',
  shape = 'rectangle',
  children,
  className,
  ...rootProps
}: AstryxAspectRatioProps) {
  return (
    <AspectRatio
      {...rootProps}
      className={cx('astryx-wb-aspect-ratio', className)}
      ratio={resolveRatioPreset(preset)}
      shape={shape}
    >
      {children ?? <div className="astryx-aspect-placeholder">{label}</div>}
    </AspectRatio>
  );
}

function resolveRatioPreset(preset: AstryxAspectRatioPreset): number {
  if (preset === '1:1') return 1;
  if (preset === '4:3') return 4 / 3;
  if (preset === '21:9') return 21 / 9;
  return 16 / 9;
}
