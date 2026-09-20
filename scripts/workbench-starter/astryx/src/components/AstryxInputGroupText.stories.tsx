import { AstryxInputGroup } from './AstryxInputGroup';
import { AstryxInputGroupText as AstryxInputGroupTextComponent } from './AstryxInputGroupText';
import { AstryxTextInput } from './AstryxTextInput';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  children: '$',
} as const;

const meta = {
  title: 'Astryx/InputGroupText',
  component: AstryxInputGroupTextComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxInputGroupText = {
  name: 'AstryxInputGroupText',
  render: (args: Args) => (
    <AstryxInputGroup label="Budget">
      <AstryxInputGroupTextComponent>{asText(args.children, DEFAULT_PROPS.children)}</AstryxInputGroupTextComponent>
      <AstryxTextInput isLabelHidden label="Budget" defaultValue="1200" />
    </AstryxInputGroup>
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
