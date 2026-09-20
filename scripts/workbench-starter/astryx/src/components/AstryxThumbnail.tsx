import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type AstryxThumbnailRootProps = Omit<
  ComponentPropsWithoutRef<typeof Thumbnail>,
  'alt' | 'className' | 'isDisabled' | 'isLoading' | 'label' | 'onClick' | 'onRemove' | 'src'
>;

export interface AstryxThumbnailProps extends AstryxThumbnailRootProps {
  src?: string;
  alt?: string;
  label?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  isRemovable?: boolean;
  isClickable?: boolean;
  className?: string;
}

export function AstryxThumbnail({
  src,
  alt = 'Attachment preview',
  label = 'attachment.png',
  isLoading = false,
  isDisabled = false,
  isRemovable = false,
  isClickable = false,
  className,
  ...rootProps
}: AstryxThumbnailProps) {
  return (
    <Thumbnail
      {...rootProps}
      alt={alt}
      className={cx('astryx-wb-thumbnail', className)}
      isDisabled={isDisabled}
      isLoading={isLoading}
      label={label}
      onClick={isClickable ? () => undefined : undefined}
      onRemove={isRemovable ? () => undefined : undefined}
      src={src || undefined}
    />
  );
}
