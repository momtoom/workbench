import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import type { HTMLAttributes } from 'react';
import './local.css';

export type RadioGroupOption = {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
};

export type RadioGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'defaultValue' | 'onChange'> & {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options?: RadioGroupOption[];
};

export function RadioGroup({
  className = '',
  defaultValue = 'default',
  disabled = false,
  label = 'Interface density',
  name = 'workbench-radio-group',
  onValueChange,
  options = DEFAULT_RADIO_GROUP_OPTIONS,
  ...props
}: RadioGroupProps) {
  return (
    <BaseRadioGroup
      {...props}
      aria-label={label}
      className={['wb-radio-group', className].filter(Boolean).join(' ')}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onValueChange={(nextValue) => onValueChange?.(String(nextValue))}
    >
      <div className="wb-radio-group__label">{label}</div>
      <div className="wb-radio-group__items">
        {options.map((option) => (
          <label
            key={option.value}
            className={['wb-radio-field', disabled || option.disabled ? 'wb-radio-field--disabled' : ''].filter(Boolean).join(' ')}
          >
            <Radio.Root
              className="wb-radio"
              disabled={disabled || option.disabled}
              value={option.value}
            >
              <Radio.Indicator className="wb-radio__indicator" keepMounted />
            </Radio.Root>
            <span className="wb-radio-field__content">
              <span className="wb-radio-field__label">{option.label}</span>
              {option.description ? (
                <span className="wb-radio-field__description">{option.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </BaseRadioGroup>
  );
}

const DEFAULT_RADIO_GROUP_OPTIONS: RadioGroupOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Balanced layout and spacing.',
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'Dense controls for repeat workflows.',
  },
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'More room for touch and scanning.',
  },
];
