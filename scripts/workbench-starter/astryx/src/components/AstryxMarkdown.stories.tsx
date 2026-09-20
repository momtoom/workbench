import { AstryxMarkdown as AstryxMarkdownComponent } from './AstryxMarkdown';

type Args = Record<string, boolean | number | string>;

const DISPLAYS = ['block', 'inline'] as const;
const DENSITIES = ['default', 'compact'] as const;
const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
const CONTENT_ALIGNS = ['start', 'center'] as const;
const CITATION_STYLES = ['label', 'number'] as const;
const AUTOLINKS = ['none', 'gfm'] as const;

const DEFAULT_PROPS = {
  autolink: 'none',
  citationStyle: 'label',
  contentAlign: 'start',
  contentWidth: '680px',
  density: 'default',
  display: 'block',
  headingLevelStart: 2,
  isStreaming: false,
  markdown: '## Source-backed notes\n\nAstryx wrappers keep official CSS and expose editable props.\n\n- Layout slots are child components\n- Markdown content is a string prop\n- Toolbar slots stay editable',
} as const;

const meta = {
  title: 'Astryx/Markdown',
  component: AstryxMarkdownComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    autolink: { control: 'select', options: AUTOLINKS },
    citationStyle: { control: 'select', options: CITATION_STYLES },
    contentAlign: { control: 'select', options: CONTENT_ALIGNS },
    contentWidth: { control: 'text' },
    density: { control: 'select', options: DENSITIES },
    display: { control: 'select', options: DISPLAYS },
    headingLevelStart: { control: 'select', options: HEADING_LEVELS },
    isStreaming: { control: 'boolean' },
    markdown: { control: 'text' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxMarkdown = {
  name: 'AstryxMarkdown',
  render: (args: Args) => (
    <AstryxMarkdownComponent
      autolink={asOption(args.autolink, AUTOLINKS, DEFAULT_PROPS.autolink)}
      citationStyle={asOption(args.citationStyle, CITATION_STYLES, DEFAULT_PROPS.citationStyle)}
      contentAlign={asOption(args.contentAlign, CONTENT_ALIGNS, DEFAULT_PROPS.contentAlign)}
      contentWidth={asText(args.contentWidth, DEFAULT_PROPS.contentWidth)}
      density={asOption(args.density, DENSITIES, DEFAULT_PROPS.density)}
      display={asOption(args.display, DISPLAYS, DEFAULT_PROPS.display)}
      headingLevelStart={asOption(args.headingLevelStart, HEADING_LEVELS, DEFAULT_PROPS.headingLevelStart)}
      isStreaming={asBoolean(args.isStreaming)}
      markdown={asText(args.markdown, DEFAULT_PROPS.markdown)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
