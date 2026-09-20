import { AstryxCheckboxList as AstryxCheckboxListComponent } from './AstryxCheckboxList';
import { AstryxCheckboxListItem } from './AstryxCheckboxListItem';

type Args = Record<string, boolean | string>;

const DENSITIES = ['compact', 'balanced', 'spacious'] as const;
const STATUSES = ['none', 'success', 'warning', 'error'] as const;

const DEFAULT_PROPS = {
  label: 'Notification channels',
  description: 'Choose every channel that should receive updates.',
  status: 'none',
  width: '100%',
  defaultValues: 'email,push',
  density: 'balanced',
  hasDividers: true,
  isDisabled: false,
  isLabelHidden: false,
  isReadOnly: false,
  statusMessage: '',
} as const;

const meta = {
  title: 'Astryx/CheckboxList',
  component: AstryxCheckboxListComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    defaultValues: { control: 'text' },
    density: { control: 'select', options: DENSITIES },
    hasDividers: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    statusMessage: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxCheckboxListItem'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxCheckboxListItem'],
        sourceFile: 'src/components/AstryxCheckboxListItem.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxCheckboxListItem label="Email" value="email" description="Digest and transactional updates" />\n<AstryxCheckboxListItem label="Push" value="push" description="Realtime product alerts" />\n<AstryxCheckboxListItem label="SMS" value="sms" description="Critical incidents only" />',
  },
};
export default meta;

export const AstryxCheckboxList = {
  name: 'AstryxCheckboxList',
  render: (args: Args) => (
    <AstryxCheckboxListComponent
      defaultValues={asText(args.defaultValues, DEFAULT_PROPS.defaultValues)}
      density={asOption(args.density, DENSITIES, DEFAULT_PROPS.density)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasDividers={asBoolean(args.hasDividers)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isReadOnly={asBoolean(args.isReadOnly)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusMessage={asText(args.statusMessage, DEFAULT_PROPS.statusMessage)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxCheckboxListItem label="Email" value="email" description="Digest and transactional updates" />
      <AstryxCheckboxListItem label="Push" value="push" description="Realtime product alerts" />
      <AstryxCheckboxListItem label="SMS" value="sms" description="Critical incidents only" />
    </AstryxCheckboxListComponent>
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
