import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Stack } from '@astryxdesign/core/Stack';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';

export type AstryxEmptyStateIcon = 'none' | AstryxIconValue;
export type AstryxEmptyStateHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type AstryxEmptyStateRootProps = Omit<
  ComponentPropsWithoutRef<typeof EmptyState>,
  'actions' | 'className' | 'description' | 'headingLevel' | 'icon' | 'isCompact' | 'title'
>;

export interface AstryxEmptyStateProps extends AstryxEmptyStateRootProps {
  title?: string;
  description?: string;
  icon?: AstryxEmptyStateIcon;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  headingLevel?: AstryxEmptyStateHeadingLevel;
  isCompact?: boolean;
  className?: string;
}

export function AstryxEmptyState({
  title = 'No items yet',
  description = 'Create the first item to start filling this workspace.',
  icon = 'info',
  primaryActionLabel = 'Create item',
  secondaryActionLabel = '',
  headingLevel = 3,
  isCompact = false,
  className,
  ...rootProps
}: AstryxEmptyStateProps) {
  const iconNode = icon === 'none' || icon === ''
    ? undefined
    : <AstryxIcon color="secondary" icon={icon || 'info'} size="lg" />;
  const actions = primaryActionLabel || secondaryActionLabel
    ? (
      <Stack direction={isCompact ? 'vertical' : 'horizontal'} gap={2} wrap="wrap">
        {secondaryActionLabel ? <Button label={secondaryActionLabel} variant="secondary" /> : null}
        {primaryActionLabel ? <Button label={primaryActionLabel} variant="primary" /> : null}
      </Stack>
    )
    : undefined;

  return (
    <EmptyState
      {...rootProps}
      actions={actions}
      className={className}
      description={description}
      headingLevel={headingLevel}
      icon={iconNode}
      isCompact={isCompact}
      title={title}
    />
  );
}
