import { Slider } from '@astryxdesign/core/Slider';
import { useEffect, useState } from 'react';

export type AstryxSliderOrientation = 'horizontal' | 'vertical';
export type AstryxSliderValueDisplay = 'tooltip' | 'text' | 'none';
export type AstryxSliderStatus = 'none' | 'warning' | 'error' | 'success';

export interface AstryxSliderProps {
  label?: string;
  defaultValue?: number;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  width?: string;
  orientation?: AstryxSliderOrientation;
  valueDisplay?: AstryxSliderValueDisplay;
  valueSuffix?: string;
  marks?: 'none' | 'quarters' | 'ends';
  status?: AstryxSliderStatus;
  statusMessage?: string;
  isLabelHidden?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxSlider({
  label = 'Progress',
  defaultValue = 48,
  description,
  min = 0,
  max = 100,
  step = 1,
  width = '100%',
  orientation = 'horizontal',
  valueDisplay = 'text',
  valueSuffix = '%',
  marks = 'none',
  status = 'none',
  statusMessage,
  isLabelHidden = false,
  isOptional = false,
  isRequired = false,
  isDisabled = false,
  className,
}: AstryxSliderProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <Slider
      className={className}
      description={description || undefined}
      formatValue={(nextValue) => `${nextValue}${valueSuffix}`}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      isOptional={!isRequired && isOptional}
      isRequired={isRequired}
      label={label}
      marks={resolveMarks(marks, min, max)}
      max={max}
      min={min}
      onChange={setValue}
      orientation={orientation}
      status={status === 'none' ? undefined : { type: status, message: statusMessage || undefined }}
      step={step}
      value={value}
      valueDisplay={valueDisplay}
      width={resolveAstryxFieldWidth(width)}
    />
  );
}

function resolveMarks(marks: 'none' | 'quarters' | 'ends', min: number, max: number) {
  if (marks === 'none') return undefined;
  if (marks === 'ends') return [{ value: min, label: String(min) }, { value: max, label: String(max) }];
  const span = max - min;
  return [
    { value: min, label: String(min) },
    { value: min + span * 0.25 },
    { value: min + span * 0.5, label: String(min + span * 0.5) },
    { value: min + span * 0.75 },
    { value: max, label: String(max) },
  ];
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
