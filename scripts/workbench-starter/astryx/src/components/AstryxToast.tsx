import { Button } from '@astryxdesign/core/Button';
import { Toast } from '@astryxdesign/core/Toast';
import {
  Children,
  isValidElement,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxToastActions,
  type AstryxToastActionsProps,
} from './AstryxToastActions';
import { AstryxToastBody, type AstryxToastBodyProps } from './AstryxToastBody';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxToastType = 'info' | 'error';
type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxToastProps extends RootProps {
  children?: ReactNode;
  type?: AstryxToastType;
  isAutoHide?: boolean;
  autoHideDuration?: number;
  isDefaultVisible?: boolean;
  launcherLabel?: string;
  className?: string;
}

export function AstryxToast({
  children,
  type = 'info',
  isAutoHide = false,
  autoHideDuration = 5000,
  isDefaultVisible = true,
  launcherLabel = 'Show notification',
  className,
  ...rootProps
}: AstryxToastProps) {
  const stableChildren = useStableAstryxChildren(children);
  const body = findSlotElement<AstryxToastBodyProps>(
    stableChildren,
    AstryxToastBody,
    'AstryxToastBody',
  );
  const actions = findSlotElement<AstryxToastActionsProps>(
    stableChildren,
    AstryxToastActions,
    'AstryxToastActions',
  );
  const [isVisible, setIsVisible] = useState(isDefaultVisible);
  useEffect(() => setIsVisible(isDefaultVisible), [isDefaultVisible]);

  return (
    <div {...rootProps} className={cx('astryx-wb-toast', className)}>
      {isVisible ? (
        <Toast
          autoHideDuration={autoHideDuration}
          body={body}
          endContent={actions}
          isAutoHide={isAutoHide}
          onDismiss={() => setIsVisible(false)}
          type={type}
        />
      ) : (
        <Button label={launcherLabel} onClick={() => setIsVisible(true)} variant="secondary" />
      )}
    </div>
  );
}

AstryxToast.displayName = 'AstryxToast';

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
