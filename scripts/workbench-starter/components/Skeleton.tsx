import type { HTMLAttributes } from 'react';
import './local.css';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  height?: string;
  width?: string;
};

export function Skeleton({
  className = '',
  height,
  style,
  width,
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      className={['wb-skeleton', className].filter(Boolean).join(' ')}
      style={{ inlineSize: width, blockSize: height, ...style }}
    />
  );
}
