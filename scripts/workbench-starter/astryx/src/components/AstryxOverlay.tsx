import { Overlay } from '@astryxdesign/core/Overlay';
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxOverlayContent,
  type AstryxOverlayContentProps,
} from './AstryxOverlayContent';
import {
  AstryxOverlayMedia,
  type AstryxOverlayMediaProps,
} from './AstryxOverlayMedia';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxOverlayShowOn = 'hover' | 'always' | 'focus' | 'hover-or-focus';
export type AstryxOverlayScrim = 'dark' | 'light' | false;
export type AstryxOverlayPosition = 'fill' | 'bottom' | 'top';
export type AstryxOverlayAlign = 'start' | 'center' | 'end';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof Overlay>,
  'align' | 'children' | 'className' | 'content' | 'isOpen' | 'position' | 'scrim' | 'showOn'
>;

export interface AstryxOverlayProps extends RootProps {
  children?: ReactNode;
  showOn?: AstryxOverlayShowOn;
  isOpen?: boolean;
  scrim?: 'dark' | 'light' | 'none';
  position?: AstryxOverlayPosition;
  align?: AstryxOverlayAlign;
  className?: string;
}

export function AstryxOverlay({
  children,
  showOn = 'always',
  isOpen,
  scrim = 'dark',
  position = 'bottom',
  align = 'start',
  className,
  ...rootProps
}: AstryxOverlayProps) {
  const stableChildren = useStableAstryxChildren(children);
  const media = findSlotElement<AstryxOverlayMediaProps>(
    stableChildren,
    AstryxOverlayMedia,
    'AstryxOverlayMedia',
  );
  const content = findSlotElement<AstryxOverlayContentProps>(
    stableChildren,
    AstryxOverlayContent,
    'AstryxOverlayContent',
  );

  return (
    <Overlay
      {...rootProps}
      align={align}
      className={cx('astryx-wb-overlay', className)}
      content={content}
      isOpen={isOpen}
      position={position}
      scrim={scrim === 'none' ? false : scrim}
      showOn={showOn}
    >
      {media ?? <div className="astryx-wb-overlay__empty-media" />}
    </Overlay>
  );
}

AstryxOverlay.displayName = 'AstryxOverlay';

function findSlotElement<Props>(
  children: ReactNode,
  component: unknown,
  name: string,
): ReactElement<Props> | undefined {
  return Children.toArray(children).find((child): child is ReactElement<Props> => {
    if (!isValidElement(child)) return false;
    if (child.type === component) return true;
    const type = child.type as { displayName?: string; name?: string } | null;
    return type?.displayName === name || type?.name === name;
  });
}
