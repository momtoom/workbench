import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxAvatarSize =
  | 'xsm'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'tiny'
  | 'xsmall'
  | 'small'
  | 'medium'
  | 'large';
export type AstryxAvatarStatus = 'none' | 'success' | 'neutral' | 'error';

type AstryxAvatarRootProps = Omit<
  ComponentPropsWithoutRef<typeof Avatar>,
  'alt' | 'className' | 'fallbackSrc' | 'name' | 'size' | 'src' | 'status'
>;

export interface AstryxAvatarProps extends AstryxAvatarRootProps {
  name?: string;
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  size?: AstryxAvatarSize;
  status?: AstryxAvatarStatus;
  statusLabel?: string;
  className?: string;
}

export function AstryxAvatar({
  name = 'Ada Lovelace',
  src,
  fallbackSrc,
  alt,
  size = 'md',
  status = 'none',
  statusLabel,
  className,
  ...rootProps
}: AstryxAvatarProps) {
  const statusNode = status === 'none'
    ? undefined
    : <AvatarStatusDot label={statusLabel || status} variant={status} />;

  return (
    <Avatar
      {...rootProps}
      alt={alt}
      className={cx('astryx-wb-avatar', className)}
      fallbackSrc={fallbackSrc}
      name={name}
      size={resolveAstryxAvatarSize(size)}
      src={src}
      status={statusNode}
    />
  );
}

export function resolveAstryxAvatarSize(size: AstryxAvatarSize) {
  if (size === 'tiny') return 'xsm' as const;
  if (size === 'xsmall') return 'sm' as const;
  if (size === 'small') return 'md' as const;
  if (size === 'medium') return 'lg' as const;
  if (size === 'large') return 'xl' as const;
  return size;
}
