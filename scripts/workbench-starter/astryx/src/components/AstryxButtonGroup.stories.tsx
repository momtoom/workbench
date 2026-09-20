import { AstryxButton } from './AstryxButton';
import { AstryxButtonGroup as AstryxButtonGroupComponent } from './AstryxButtonGroup';
import { AstryxIcon } from './AstryxIcon';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  label: 'Grouped actions',
  orientation: 'horizontal',
  size: 'md',
  isDisabled: false,
} as const;

const meta = {
  title: 'Astryx/ButtonGroup',
  component: AstryxButtonGroupComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    orientation: { control: 'select', options: ORIENTATIONS },
    size: { control: 'select', options: SIZES },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Actions',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxButton'],
        sourceFile: 'src/components/AstryxButton.tsx',
      },
      {
        names: ['AstryxIcon'],
        sourceFile: 'src/components/AstryxIcon.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxButton label="Copy"><AstryxIcon icon="copy" size="sm" />Copy</AstryxButton>\n<AstryxButton label="Cut"><AstryxIcon icon="scissors" size="sm" />Cut</AstryxButton>\n<AstryxButton label="Paste"><AstryxIcon icon="clipboard-paste" size="sm" />Paste</AstryxButton>',
  },
};
export default meta;

export const AstryxButtonGroup = {
  name: 'AstryxButtonGroup',
  render: (args: Args) => (
    <AstryxButtonGroupComponent
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
    >
      <AstryxButton label="Copy">
        <AstryxIcon icon="copy" size="sm" />
        Copy
      </AstryxButton>
      <AstryxButton label="Cut">
        <AstryxIcon icon="scissors" size="sm" />
        Cut
      </AstryxButton>
      <AstryxButton label="Paste">
        <AstryxIcon icon="clipboard-paste" size="sm" />
        Paste
      </AstryxButton>
    </AstryxButtonGroupComponent>
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
