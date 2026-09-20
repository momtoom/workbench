import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import type { HTMLAttributes } from 'react';
import './local.css';

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  fallback?: string;
  imageAlt?: string;
  imageSrc?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function Avatar({
  className = '',
  fallback = 'WB',
  imageAlt = '',
  imageSrc,
  size = 'md',
  ...props
}: AvatarProps) {
  const sizeClassName = `wb-avatar--${size}`;
  return (
    <BaseAvatar.Root {...props} className={['wb-avatar', sizeClassName, className].filter(Boolean).join(' ')}>
      {imageSrc ? (
        <BaseAvatar.Image className="wb-avatar__image" src={imageSrc} alt={imageAlt} />
      ) : null}
      <BaseAvatar.Fallback className="wb-avatar__fallback">
        {fallback}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
