import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ComponentProps } from 'react';
import './local.css';

export type SwitchProps = Omit<ComponentProps<typeof BaseSwitch.Root>, 'children' | 'className'> & {
  className?: string;
  label?: string;
};

export function Switch({
  className = '',
  defaultChecked,
  disabled,
  label,
  ...props
}: SwitchProps) {
  return (
    <label className={['wb-switch-field', disabled ? 'wb-switch-field--disabled' : ''].filter(Boolean).join(' ')}>
      <BaseSwitch.Root
        {...props}
        className={['wb-switch', className].filter(Boolean).join(' ')}
        defaultChecked={defaultChecked}
        disabled={disabled}
      >
        <BaseSwitch.Thumb className="wb-switch__thumb" />
      </BaseSwitch.Root>
      {label ? <span className="wb-switch-field__label">{label}</span> : null}
    </label>
  );
}
