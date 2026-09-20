import type { BadgeVariant } from '@astryxdesign/core/Badge';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxChatComposerSuggestionTrigger = '@' | '/';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxChatComposerSuggestionProps extends RootProps {
  trigger?: AstryxChatComposerSuggestionTrigger;
  value?: string;
  label?: string;
  description?: string;
  tokenLabel?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function AstryxChatComposerSuggestion({
  trigger = '@',
  value = 'cindy',
  label = 'Cindy Zhang',
  description = 'Design Systems',
  tokenLabel,
  variant = 'blue',
  className,
  ...rootProps
}: AstryxChatComposerSuggestionProps) {
  return (
    <div
      {...rootProps}
      className={cx(
        'astryx-wb-chat-composer-suggestion flex min-w-0 flex-1 flex-col',
        className,
      )}
      data-astryx-chat-composer-suggestion-token-label={tokenLabel}
      data-astryx-chat-composer-suggestion-trigger={trigger}
      data-astryx-chat-composer-suggestion-value={value}
      data-astryx-chat-composer-suggestion-variant={variant}
    >
      <span className="block truncate">{label}</span>
      {description ? (
        <span className="block truncate text-[length:var(--text-supporting-size)] text-[color:var(--color-text-secondary)]">
          {description}
        </span>
      ) : null}
    </div>
  );
}

AstryxChatComposerSuggestion.displayName = 'AstryxChatComposerSuggestion';
