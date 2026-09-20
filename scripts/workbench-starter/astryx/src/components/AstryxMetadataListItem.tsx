import { MetadataListItem } from '@astryxdesign/core/MetadataList';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';

type AstryxMetadataListItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof MetadataListItem>,
  'children' | 'className' | 'icon' | 'label'
>;

export interface AstryxMetadataListItemProps extends AstryxMetadataListItemRootProps {
  label?: string;
  value?: string;
  children?: ReactNode;
  icon?: AstryxIconValue | 'none';
  className?: string;
}

export function AstryxMetadataListItem({
  label = 'Metadata',
  value = 'Value',
  children,
  icon = 'none',
  className,
  style,
  ...rootProps
}: AstryxMetadataListItemProps) {
  const content = children ?? value;
  const item = (
    <MetadataListItem
      className={className}
      icon={renderMetadataIcon(icon)}
      label={label}
      style={style}
    >
      {content}
    </MetadataListItem>
  );

  if (Object.keys(rootProps).length === 0) return item;

  return (
    <span {...rootProps} style={{ display: 'contents' } satisfies CSSProperties}>
      {item}
    </span>
  );
}

function renderMetadataIcon(icon: AstryxIconValue | 'none') {
  return icon === 'none' || icon === '' ? undefined : <AstryxIcon color="secondary" icon={icon} size="sm" />;
}
