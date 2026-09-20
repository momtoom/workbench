import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxChatComposerFeedbackOption,
  type AstryxChatComposerFeedbackOptionProps,
} from './AstryxChatComposerFeedbackOption';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxChatComposerFeedbackProps extends RootProps {
  question?: string;
  defaultSelectedKey?: string;
  children?: ReactNode;
  className?: string;
}

export function AstryxChatComposerFeedback({
  question = 'Do you want to proceed?',
  defaultSelectedKey = '',
  children,
  className,
  ...rootProps
}: AstryxChatComposerFeedbackProps) {
  const [selectedKey, setSelectedKey] = useState(defaultSelectedKey);
  const options = collectFeedbackOptions(children);

  return (
    <div
      {...rootProps}
      className={cx(
        'astryx-wb-chat-composer-feedback flex w-full min-w-0 flex-col gap-1',
        className,
      )}
    >
      <List>
        <ListItem
          label={<Text weight="bold">{question}</Text>}
        />
        {options.map((option) =>
          cloneElement(option, {
            isSelected:
              selectedKey === (option.props.optionKey || 'A') ||
              option.props.isSelected,
            onOptionSelect: setSelectedKey,
          }),
        )}
      </List>
    </div>
  );
}

function collectFeedbackOptions(
  children: ReactNode,
): ReactElement<AstryxChatComposerFeedbackOptionProps>[] {
  return Children.toArray(children).filter(
    (
      child,
    ): child is ReactElement<AstryxChatComposerFeedbackOptionProps> =>
      isValidElement<AstryxChatComposerFeedbackOptionProps>(child) &&
      isAstryxElementType(
        child,
        AstryxChatComposerFeedbackOption,
        'AstryxChatComposerFeedbackOption',
      ),
  );
}

AstryxChatComposerFeedback.displayName = 'AstryxChatComposerFeedback';
