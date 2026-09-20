import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import type { ComponentProps } from 'react';
import { Icon } from './Icon';
import './local.css';

export type CheckboxProps = Omit<ComponentProps<typeof BaseCheckbox.Root>, 'children' | 'className'> & {
  className?: string;
  label?: string;
};

export function Checkbox({
  className = '',
  defaultChecked,
  disabled,
  label = 'Accept terms',
  ...props
}: CheckboxProps) {
  return (
    <label className={['wb-checkbox-field', disabled ? 'wb-checkbox-field--disabled' : ''].filter(Boolean).join(' ')}>
      <BaseCheckbox.Root
        {...props}
        className={['wb-checkbox', className].filter(Boolean).join(' ')}
        defaultChecked={defaultChecked}
        disabled={disabled}
      >
        <BaseCheckbox.Indicator className="wb-checkbox__indicator" keepMounted>
          <Icon name="check" size={14} />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <span className="wb-checkbox-field__label">{label}</span>
    </label>
  );
}
