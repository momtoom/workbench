import { Markdown } from '@astryxdesign/core/Markdown';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxMarkdownDisplay = 'block' | 'inline';
export type AstryxMarkdownDensity = 'default' | 'compact';
export type AstryxMarkdownHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type AstryxMarkdownContentAlign = 'start' | 'center';
export type AstryxMarkdownCitationStyle = 'label' | 'number';
export type AstryxMarkdownAutolink = 'none' | 'gfm';

type AstryxMarkdownRootProps = Omit<
  ComponentPropsWithoutRef<typeof Markdown>,
  | 'autolink'
  | 'children'
  | 'citationStyle'
  | 'className'
  | 'contentAlign'
  | 'contentWidth'
  | 'density'
  | 'display'
  | 'headingLevelStart'
  | 'inlinePlugins'
  | 'isStreaming'
  | 'onLinkClick'
  | 'sources'
>;

export interface AstryxMarkdownProps extends AstryxMarkdownRootProps {
  markdown?: string;
  display?: AstryxMarkdownDisplay;
  density?: AstryxMarkdownDensity;
  headingLevelStart?: AstryxMarkdownHeadingLevel;
  isStreaming?: boolean;
  citationStyle?: AstryxMarkdownCitationStyle;
  contentWidth?: string;
  contentAlign?: AstryxMarkdownContentAlign;
  autolink?: AstryxMarkdownAutolink;
  className?: string;
}

export function AstryxMarkdown({
  markdown = '# Astryx notes\n\n- Source-backed wrappers\n- Official theme CSS\n- Editable component contracts',
  display = 'block',
  density = 'default',
  headingLevelStart = 2,
  isStreaming = false,
  citationStyle = 'label',
  contentWidth = '680px',
  contentAlign = 'start',
  autolink = 'none',
  className,
  ...rootProps
}: AstryxMarkdownProps) {
  return (
    <Markdown
      {...rootProps}
      autolink={autolink === 'none' ? undefined : autolink}
      citationStyle={citationStyle}
      className={cx('astryx-wb-markdown', className)}
      contentAlign={contentAlign}
      contentWidth={resolveAstryxMarkdownContentWidth(contentWidth)}
      density={density}
      display={display}
      headingLevelStart={headingLevelStart}
      isStreaming={isStreaming}
    >
      {markdown}
    </Markdown>
  );
}

function resolveAstryxMarkdownContentWidth(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
