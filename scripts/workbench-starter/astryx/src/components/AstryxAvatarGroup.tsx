import { AvatarGroup } from '@astryxdesign/core/AvatarGroup';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { resolveAstryxAvatarSize, type AstryxAvatarSize } from './AstryxAvatar';

type AstryxAvatarGroupRootProps = Omit<ComponentPropsWithoutRef<typeof AvatarGroup>, 'children' | 'className' | 'size'>;

export interface AstryxAvatarGroupProps extends AstryxAvatarGroupRootProps {
  children?: ReactNode;
  size?: AstryxAvatarSize;
  className?: string;
}

export function AstryxAvatarGroup({
  children,
  size = 'md',
  className,
  ...rootProps
}: AstryxAvatarGroupProps) {
  return (
    <AvatarGroup {...rootProps} className={className} size={resolveAstryxAvatarSize(size)}>
      {children}
    </AvatarGroup>
  );
}
