import { Button } from '@astryxdesign/core/Button';
import { Lightbox, type LightboxMedia } from '@astryxdesign/core/Lightbox';
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxThumbnail, type AstryxThumbnailProps } from './AstryxThumbnail';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;
export interface AstryxLightboxProps extends RootProps {
  children?: ReactNode;
  label?: string;
  isDefaultOpen?: boolean;
  defaultIndex?: number;
  hasZoom?: boolean;
  hasAutoPlay?: boolean;
  className?: string;
}
export function AstryxLightbox({
  children,
  label = 'Open lightbox',
  isDefaultOpen = false,
  defaultIndex = 0,
  hasZoom = true,
  hasAutoPlay = false,
  className,
  ...rootProps
}: AstryxLightboxProps) {
  const stableChildren = useStableAstryxChildren(children);
  const items = useMemo(() => getThumbnailChildren(stableChildren), [stableChildren]);
  const media = useMemo(() => items.map(toLightboxMedia), [items]);
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [index, setIndex] = useState(defaultIndex);
  useEffect(() => setIsOpen(isDefaultOpen), [isDefaultOpen]);
  useEffect(() => setIndex(defaultIndex), [defaultIndex]);
  useEffect(() => {
    setIndex((currentIndex) => clampIndex(currentIndex, media.length));
  }, [media.length]);
  const openAt = (nextIndex: number) => {
    setIndex(clampIndex(nextIndex, media.length));
    setIsOpen(media.length > 0);
  };
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-launcher', 'astryx-wb-lightbox-launcher', className)}
    >
      <Button
        isDisabled={media.length === 0}
        label={label}
        onClick={() => openAt(index)}
        variant="secondary"
      />
      <div className="astryx-wb-lightbox__items">
        {items.map((item, itemIndex) => (
          <div
            className="astryx-wb-lightbox__item"
            key={item.key ?? itemIndex}
            onClick={() => openAt(itemIndex)}
          >
            {cloneElement(item, { isClickable: true })}
          </div>
        ))}
      </div>
      {media.length > 0 ? (
        <Lightbox
          className="astryx-wb-lightbox"
          hasAutoPlay={hasAutoPlay}
          hasZoom={hasZoom}
          index={clampIndex(index, media.length)}
          isOpen={isOpen}
          media={media}
          onIndexChange={setIndex}
          onOpenChange={setIsOpen}
        />
      ) : null}
    </div>
  );
}

function getThumbnailChildren(children: ReactNode): ReactElement<AstryxThumbnailProps>[] {
  return Children.toArray(children)
    .map(findThumbnailElement)
    .filter((child): child is ReactElement<AstryxThumbnailProps> => child !== null);
}

function findThumbnailElement(node: ReactNode): ReactElement<AstryxThumbnailProps> | null {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (isNamedComponent(node.type, AstryxThumbnail, 'AstryxThumbnail')) {
    return node as ReactElement<AstryxThumbnailProps>;
  }
  for (const child of Children.toArray(node.props.children)) {
    const match = findThumbnailElement(child);
    if (match) return match;
  }
  return null;
}

function isNamedComponent(type: unknown, component: unknown, name: string): boolean {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}

function toLightboxMedia(item: ReactElement<AstryxThumbnailProps>, index: number): LightboxMedia {
  const label = item.props.label?.trim();
  return {
    alt: item.props.alt?.trim() || label || `Gallery image ${index + 1}`,
    caption: label,
    src: item.props.src?.trim() || '',
    type: 'image',
  };
}

function clampIndex(index: number, itemCount: number): number {
  return itemCount > 0 ? Math.min(Math.max(0, index), itemCount - 1) : 0;
}
