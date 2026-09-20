import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxCollapsibleGroupType = 'single' | 'multiple';
export type AstryxCollapsibleGroupDensity = 'compact' | 'balanced' | 'spacious';

type AstryxCollapsibleGroupRootProps = Omit<
  ComponentPropsWithoutRef<typeof CollapsibleGroup>,
  'children' | 'className' | 'defaultValue' | 'density' | 'hasDividers' | 'onChange' | 'type' | 'value'
>;

type OfficialCollapsibleGroupProps = ComponentPropsWithoutRef<typeof CollapsibleGroup>;

export interface AstryxCollapsibleGroupProps extends AstryxCollapsibleGroupRootProps {
  type?: AstryxCollapsibleGroupType;
  defaultValue?: string;
  hasDividers?: boolean;
  density?: AstryxCollapsibleGroupDensity;
  className?: string;
  children?: ReactNode;
}

export function AstryxCollapsibleGroup({
  type = 'single',
  defaultValue = 'shipping',
  hasDividers = true,
  density = 'balanced',
  className,
  children,
  ...rootProps
}: AstryxCollapsibleGroupProps) {
  return (
    <CollapsibleGroup
      {...rootProps}
      className={cx('astryx-wb-collapsible-group', className)}
      defaultValue={resolveDefaultValue(type, defaultValue)}
      density={density}
      hasDividers={hasDividers}
      type={type}
    >
      {children}
    </CollapsibleGroup>
  );
}

function resolveDefaultValue(
  type: AstryxCollapsibleGroupType,
  value: string,
): OfficialCollapsibleGroupProps['defaultValue'] {
  if (type === 'multiple') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value || undefined;
}
