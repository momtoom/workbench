import { AstryxCodeBlock as AstryxCodeBlockComponent } from './AstryxCodeBlock';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md'] as const;
const CONTAINERS = ['card', 'section'] as const;
const HIGHLIGHT_MODES = ['auto', 'ranges', 'spans'] as const;
const LANGUAGES = [
  'plaintext',
  'typescript',
  'tsx',
  'javascript',
  'jsx',
  'json',
  'html',
  'css',
  'python',
  'bash',
  'php',
  'hack',
  'yaml',
  'markdown',
] as const;

const DEFAULT_PROPS = {
  title: 'example.tsx',
  size: 'md',
  width: '100%',
  maxHeight: '',
  code: "const theme = 'neutral';\nconsole.log(theme);",
  container: 'card',
  hasCopyButton: false,
  hasLanguageLabel: true,
  hasLineNumbers: true,
  highlightMode: 'spans',
  isCollapsible: false,
  isWrapped: false,
  language: 'tsx',
} as const;

const meta = {
  title: 'Astryx/CodeBlock',
  component: AstryxCodeBlockComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    size: { control: 'select', options: SIZES },
    width: { control: 'text' },
    maxHeight: { control: 'text' },
    code: { control: 'textarea' },
    container: { control: 'select', options: CONTAINERS },
    hasCopyButton: { control: 'boolean' },
    hasLanguageLabel: { control: 'boolean' },
    hasLineNumbers: { control: 'boolean' },
    highlightMode: { control: 'select', options: HIGHLIGHT_MODES },
    isCollapsible: { control: 'boolean' },
    isWrapped: { control: 'boolean' },
    language: { control: 'text', suggestions: LANGUAGES },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxCodeBlock = {
  name: 'AstryxCodeBlock',
  render: (args: Args) => (
    <AstryxCodeBlockComponent
      code={asText(args.code, DEFAULT_PROPS.code)}
      container={asOption(args.container, CONTAINERS, DEFAULT_PROPS.container)}
      hasCopyButton={asBoolean(args.hasCopyButton)}
      highlightMode={asOption(args.highlightMode, HIGHLIGHT_MODES, DEFAULT_PROPS.highlightMode)}
      hasLanguageLabel={asBoolean(args.hasLanguageLabel)}
      hasLineNumbers={asBoolean(args.hasLineNumbers)}
      isCollapsible={asBoolean(args.isCollapsible)}
      isWrapped={asBoolean(args.isWrapped)}
      language={asText(args.language, DEFAULT_PROPS.language)}
      maxHeight={asText(args.maxHeight)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      title={asText(args.title, DEFAULT_PROPS.title)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
