import { Skeleton } from '@astryxdesign/core/Skeleton';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxSkeletonRadius = 'none' | 0 | 1 | 2 | 3 | 4 | 'rounded';

type AstryxSkeletonRootProps = Omit<ComponentPropsWithoutRef<typeof Skeleton>, 'className' | 'height' | 'index' | 'radius' | 'width'>;

export interface AstryxSkeletonProps extends AstryxSkeletonRootProps {
  width?: number | string;
  height?: number | string;
  radius?: AstryxSkeletonRadius;
  index?: number;
  className?: string;
}

export function AstryxSkeleton({
  width = '100%',
  height = 20,
  radius = 3,
  index = 0,
  className,
  ...rootProps
}: AstryxSkeletonProps) {
  return <Skeleton {...rootProps} className={className} height={height} index={index} radius={radius} width={width} />;
}
