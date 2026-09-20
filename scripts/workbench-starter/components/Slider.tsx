import { Slider as BaseSlider } from '@base-ui/react/slider';
import type { HTMLAttributes } from 'react';
import './local.css';

export type SliderProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'defaultValue' | 'onChange'> & {
  className?: string;
  defaultValue?: number;
  disabled?: boolean;
  label?: string;
  max?: number;
  min?: number;
  name?: string;
  onValueChange?: (value: number) => void;
  showValue?: boolean;
  step?: number;
  value?: number;
};

export function Slider({
  className = '',
  defaultValue = 48,
  disabled,
  label = 'Density',
  max = 100,
  min = 0,
  name,
  onValueChange,
  showValue = true,
  step = 1,
  value,
  ...props
}: SliderProps) {
  return (
    <BaseSlider.Root
      {...props}
      className={['wb-slider', className].filter(Boolean).join(' ')}
      defaultValue={defaultValue}
      disabled={disabled}
      max={max}
      min={min}
      name={name}
      onValueChange={(nextValue) => onValueChange?.(Number(nextValue))}
      step={step}
      value={value}
    >
      <div className="wb-slider__header">
        <BaseSlider.Label className="wb-slider__label">{label}</BaseSlider.Label>
        {showValue ? (
          <BaseSlider.Value className="wb-slider__value">
            {(formattedValues) => formattedValues[0] ?? String(value ?? defaultValue)}
          </BaseSlider.Value>
        ) : null}
      </div>
      <BaseSlider.Control className="wb-slider__control">
        <BaseSlider.Track className="wb-slider__track">
          <BaseSlider.Indicator className="wb-slider__indicator" />
        </BaseSlider.Track>
        <BaseSlider.Thumb className="wb-slider__thumb" getAriaLabel={() => label} />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
