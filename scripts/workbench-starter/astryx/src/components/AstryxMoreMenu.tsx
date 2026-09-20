import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
} from 'react';
import { AstryxIcon } from './AstryxIcon';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxMoreMenuVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type AstryxMoreMenuSize = 'sm' | 'md' | 'lg';
type RootProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenu>,
  'button' | 'children' | 'className' | 'hasChevron' | 'isMenuOpen' | 'items' | 'onClick' | 'onOpenChange'
>;
export interface AstryxMoreMenuProps extends RootProps {
  label?: string;
  variant?: AstryxMoreMenuVariant;
  size?: AstryxMoreMenuSize;
  isDisabled?: boolean;
  isDefaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}
export function AstryxMoreMenu({
  label = 'More options',
  variant = 'ghost',
  size = 'md',
  isDisabled = false,
  isDefaultOpen = false,
  className,
  children,
  ...rootProps
}: AstryxMoreMenuProps) {
  const stableChildren = useStableAstryxChildren(children);
  const { ref: triggerRef, ...dropdownRootProps } = rootProps as RootProps & {
    ref?: Ref<HTMLButtonElement>;
  };
  const triggerRuntimeProps = Object.fromEntries(
    Object.entries(dropdownRootProps).filter(([name]) => name.startsWith('data-wb-')),
  );
  const localTriggerRef = useRef<HTMLButtonElement | null>(null);
  const setTriggerRef = useCallback((node: HTMLButtonElement | null) => {
    localTriggerRef.current = node;
    if (typeof triggerRef === 'function') {
      triggerRef(node);
    } else if (triggerRef) {
      triggerRef.current = node;
    }
  }, [triggerRef]);
  useEffect(() => {
    const trigger = localTriggerRef.current;
    if (!trigger) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (isOpen === isDefaultOpen) return;
    const frame = requestAnimationFrame(() => trigger.click());
    return () => cancelAnimationFrame(frame);
  }, [isDefaultOpen]);

  return (
    <DropdownMenu
      {...dropdownRootProps}
      button={{
        ...triggerRuntimeProps,
        ref: setTriggerRef,
        className: cx('astryx-wb-more-menu', className),
        icon: <AstryxIcon color="inherit" icon="moreHorizontal" size="sm" />,
        isDisabled,
        isIconOnly: true,
        label,
        size,
        tooltip: label,
        variant,
      }}
      className="astryx-wb-more-menu__content"
      hasChevron={false}
    >
      {stableChildren}
    </DropdownMenu>
  );
}
