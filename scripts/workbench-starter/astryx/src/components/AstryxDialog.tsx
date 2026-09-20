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

export type AstryxDialogPurpose = 'required' | 'form' | 'info';
export type AstryxDialogVariant = 'standard' | 'fullscreen';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxDialogProps extends RootProps {
  children?: ReactNode;
  launcherLabel?: string;
  isDefaultOpen?: boolean;
  isInline?: boolean;
  purpose?: AstryxDialogPurpose;
  variant?: AstryxDialogVariant;
  width?: string;
  maxHeight?: string;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  className?: string;
}

export function AstryxDialog({
  children,
  launcherLabel = 'Open dialog',
  isDefaultOpen = true,
  isInline = true,
  purpose = 'info',
  variant = 'standard',
  width = '480px',
  maxHeight = '75vh',
  padding,
  className,
  ...rootProps
}: AstryxDialogProps) {
  const stableChildren = useStableAstryxChildren(children);
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  useEffect(() => setIsOpen(isDefaultOpen), [isDefaultOpen]);

  return (
    <div {...rootProps} className={cx('astryx-wb-launcher', className)}>
      {!isInline && !isOpen ? (
        <Button label={launcherLabel} onClick={() => setIsOpen(true)} variant="secondary" />
      ) : null}
      <Dialog
        className="astryx-wb-dialog"
        isInline={isInline}
        isOpen={isOpen}
        maxHeight={resolveSize(maxHeight)}
        onOpenChange={setIsOpen}
        padding={padding}
        purpose={purpose}
        variant={variant}
        width={resolveSize(width)}
      >
        {stableChildren}
      </Dialog>
    </div>
  );
}

AstryxDialog.displayName = 'AstryxDialog';

function resolveSize(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
