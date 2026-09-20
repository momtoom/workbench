import { SelectorOption } from '@astryxdesign/core/Selector';
import type { IconType } from '@astryxdesign/core/Icon';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

type AstryxSelectorOptionRootProps = Omit<
  ComponentPropsWithoutRef<typeof SelectorOption>,
  'className' | 'description' | 'endContent' | 'icon' | 'label'
>;
type AstryxSelectorOptionIconContent = ReactNode | IconType;

export interface AstryxSelectorOptionProps extends AstryxSelectorOptionRootProps {
  value?: string;
  label?: string;
  description?: string;
  icon?: AstryxIconValue | 'none';
  endLabel?: string;
  isDisabled?: boolean;
  className?: string;
}

export interface AstryxSelectorOptionData {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  icon?: AstryxSelectorOptionIconContent;
  endLabel?: string;
}

export function AstryxSelectorOption({
  value = 'option',
  label = 'Option',
  description,
  icon = 'none',
  endLabel,
  className,
  ...rootProps
}: AstryxSelectorOptionProps) {
  return (
    <SelectorOption
      {...rootProps}
      className={cx('astryx-wb-selector-option', className)}
      description={description || undefined}
      endContent={renderAstryxSelectorOptionEndLabel(endLabel)}
      icon={renderAstryxSelectorOptionIcon(icon)}
      label={label || value}
    />
  );
}

AstryxSelectorOption.displayName = 'AstryxSelectorOption';

export function toAstryxSelectorOptionData(props: AstryxSelectorOptionProps): AstryxSelectorOptionData {
  const value = props.value || slugifySelectorLabel(props.label || 'option');
  return {
    value,
    label: props.label || value,
    description: props.description || undefined,
    disabled: props.isDisabled || undefined,
    icon: renderAstryxSelectorOptionIcon(props.icon),
    endLabel: props.endLabel || undefined,
  };
}

export function renderAstryxSelectorOptionIcon(icon: AstryxIconValue | 'none' | undefined): ReactNode {
  if (!icon || icon === 'none') return undefined;
  return <AstryxIcon icon={icon} size="sm" />;
}

export function renderAstryxSelectorOptionEndLabel(endLabel: string | undefined): ReactNode {
  const label = endLabel?.trim();
  return label ? <span className="astryx-wb-selector-option-end-label">{label}</span> : undefined;
}

function slugifySelectorLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'option';
}
