import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxButton, type AstryxButtonProps } from './AstryxButton';
import { cx } from './classNames';

type AstryxMobileNavTriggerRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className'
>;

export interface AstryxMobileNavTriggerProps extends AstryxMobileNavTriggerRootProps {
  children?: ReactNode;
  className?: string;
}

export const AstryxMobileNavTriggerOpenContext = createContext<(() => void) | null>(null);

export function AstryxMobileNavTrigger({
  children,
  className,
  ...rootProps
}: AstryxMobileNavTriggerProps) {
  const openNavigation = useContext(AstryxMobileNavTriggerOpenContext);
  const childArray = Children.toArray(children);
  const button = childArray.find(isMobileNavTriggerButton);
  const renderedChildren = childArray.map((child) => (
    child === button
      ? cloneElement(button, {
          onClick: (...args: Parameters<NonNullable<AstryxButtonProps['onClick']>>) => {
            button.props.onClick?.(...args);
            openNavigation?.();
          },
        } as Partial<AstryxButtonProps>)
      : child
  ));

  return (
    <div {...rootProps} className={cx('astryx-wb-mobile-nav-trigger', className)}>
      {renderedChildren}
    </div>
  );
}

AstryxMobileNavTrigger.displayName = 'AstryxMobileNavTrigger';

function isMobileNavTriggerButton(child: ReactNode): child is ReactElement<AstryxButtonProps> {
  if (!isValidElement(child)) return false;
  if (child.type === AstryxButton) return true;
  const type = child.type as { displayName?: string; name?: string } | null;
  return type?.displayName === 'AstryxButton' || type?.name === 'AstryxButton';
}
