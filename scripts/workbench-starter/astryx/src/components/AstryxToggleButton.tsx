import { ToggleButton } from '@astryxdesign/core/ToggleButton';
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

export type AstryxToggleButtonSize = 'sm' | 'md' | 'lg';

type AstryxToggleButtonRootProps = Omit<
  ComponentPropsWithoutRef<typeof ToggleButton>,
  | 'children'
  | 'className'
  | 'icon'
  | 'isDisabled'
  | 'isIconOnly'
  | 'isLoading'
  | 'isPressed'
  | 'label'
  | 'onPressedChange'
  | 'pressedIcon'
  | 'size'
  | 'tooltip'
  | 'value'
>;

export interface AstryxToggleButtonProps extends AstryxToggleButtonRootProps {
  label?: string;
  value?: string;
  defaultPressed?: boolean;
  icon?: AstryxIconValue | 'none';
  pressedIcon?: AstryxIconValue | 'none';
  size?: AstryxToggleButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  isIconOnly?: boolean;
  tooltip?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxToggleButton({
  label = 'Toggle',
  value = 'toggle',
  defaultPressed = false,
  icon = 'none',
  pressedIcon = 'none',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  isIconOnly = false,
  tooltip,
  className,
  children,
  ...rootProps
}: AstryxToggleButtonProps) {
  const [isPressed, setIsPressed] = useState(defaultPressed);

  useEffect(() => {
    setIsPressed(defaultPressed);
  }, [defaultPressed]);

  return (
    <ToggleButton
      {...rootProps}
      className={cx('astryx-wb-toggle-button', className)}
      icon={renderToggleIcon(icon)}
      isDisabled={isDisabled}
      isIconOnly={isIconOnly}
      isLoading={isLoading}
      isPressed={isPressed}
      label={label}
      onPressedChange={(nextPressed) => setIsPressed(nextPressed)}
      pressedIcon={renderToggleIcon(pressedIcon)}
      size={size}
      tooltip={tooltip}
      value={value}
    >
      {children}
    </ToggleButton>
  );
}

function renderToggleIcon(icon: AstryxIconValue | 'none') {
  return icon === 'none' || icon === '' ? undefined : <AstryxIcon color="inherit" icon={icon} size="sm" />;
}
