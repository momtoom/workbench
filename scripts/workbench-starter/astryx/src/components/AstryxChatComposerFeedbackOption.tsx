import { Badge } from '@astryxdesign/core/Badge';
import { ListItem } from '@astryxdesign/core/List';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ListItem>,
  | 'className'
  | 'description'
  | 'endContent'
  | 'isDisabled'
  | 'isSelected'
  | 'label'
  | 'onClick'
  | 'startContent'
>;

export interface AstryxChatComposerFeedbackOptionProps extends RootProps {
  optionKey?: string;
  label?: string;
  description?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  className?: string;
  onOptionSelect?: (optionKey: string) => void;
}

export function AstryxChatComposerFeedbackOption({
  optionKey = 'A',
  label = 'Yes',
  description,
  isSelected = false,
  isDisabled = false,
  className,
  onOptionSelect,
  ...rootProps
}: AstryxChatComposerFeedbackOptionProps) {
  return (
    <ListItem
      {...rootProps}
      className={cx('astryx-wb-chat-composer-feedback-option', className)}
      description={description || undefined}
      isDisabled={isDisabled}
      isSelected={isSelected}
      label={
        <span className="astryx-wb-chat-composer-feedback-option__label">
          {label}
        </span>
      }
      onClick={
        isDisabled || !onOptionSelect
          ? undefined
          : () => onOptionSelect(optionKey)
      }
      startContent={
        <Badge
          label={optionKey}
          variant={isSelected ? 'info' : 'neutral'}
        />
      }
    />
  );
}

AstryxChatComposerFeedbackOption.displayName =
  'AstryxChatComposerFeedbackOption';
