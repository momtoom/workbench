import { Button } from '@astryxdesign/core/Button';
import { Dialog } from '@astryxdesign/core/Dialog';
import {
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxAlertDialogActionVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxAlertDialogProps extends RootProps {
  children?: ReactNode;
  launcherLabel?: string;
  isDefaultOpen?: boolean;
  isInline?: boolean;
  width?: string;
  className?: string;
}

export function AstryxAlertDialog({
  children,
  launcherLabel = 'Open confirmation',
  isDefaultOpen = true,
  isInline = true,
  width = '400px',
  className,
  ...rootProps
}: AstryxAlertDialogProps) {
  const stableChildren = useStableAstryxChildren(children);
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  useEffect(() => setIsOpen(isDefaultOpen), [isDefaultOpen]);

  return (
    <div {...rootProps} className={cx('astryx-wb-launcher', className)}>
      {!isInline && !isOpen ? (
        <Button label={launcherLabel} onClick={() => setIsOpen(true)} variant="destructive" />
      ) : null}
      <Dialog
        className="astryx-wb-alert-dialog"
        isInline={isInline}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        purpose="required"
        width={resolveSize(width)}
      >
        {stableChildren}
      </Dialog>
    </div>
  );
}

AstryxAlertDialog.displayName = 'AstryxAlertDialog';

function resolveSize(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
