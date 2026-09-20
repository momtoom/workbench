import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxCodeBlockSize = 'sm' | 'md';
export type AstryxCodeBlockContainer = 'card' | 'section';
export type AstryxCodeBlockHighlightMode = 'auto' | 'ranges' | 'spans';

type AstryxCodeBlockRootProps = Omit<
  ComponentPropsWithoutRef<typeof CodeBlock>,
  | 'className'
  | 'code'
  | 'container'
  | 'hasCopyButton'
  | 'highlightMode'
  | 'hasLanguageLabel'
  | 'hasLineNumbers'
  | 'isCollapsible'
  | 'isWrapped'
  | 'language'
  | 'maxHeight'
  | 'size'
  | 'title'
  | 'width'
>;

export interface AstryxCodeBlockProps extends AstryxCodeBlockRootProps {
  code?: string;
  language?: string;
  title?: string;
  hasLanguageLabel?: boolean;
  hasLineNumbers?: boolean;
  hasCopyButton?: boolean;
  highlightMode?: AstryxCodeBlockHighlightMode;
  isWrapped?: boolean;
  isCollapsible?: boolean;
  maxHeight?: string;
  width?: string;
  size?: AstryxCodeBlockSize;
  container?: AstryxCodeBlockContainer;
  className?: string;
}

export function AstryxCodeBlock({
  code = "const theme = 'neutral';\nconsole.log(theme);",
  language = 'tsx',
  title = 'example.tsx',
  hasLanguageLabel = true,
  hasLineNumbers = true,
  hasCopyButton = false,
  highlightMode = 'spans',
  isWrapped = false,
  isCollapsible = false,
  maxHeight,
  width = '100%',
  size = 'md',
  container = 'card',
  className,
  ...rootProps
}: AstryxCodeBlockProps) {
  return (
    <CodeBlock
      {...rootProps}
      className={cx('astryx-wb-code-block', className)}
      code={code}
      container={container}
      hasCopyButton={hasCopyButton}
      highlightMode={highlightMode}
      hasLanguageLabel={hasLanguageLabel}
      hasLineNumbers={hasLineNumbers}
      isCollapsible={isCollapsible}
      isWrapped={isWrapped}
      language={language}
      maxHeight={maxHeight || undefined}
      size={size}
      title={title}
      width={width}
    />
  );
}
