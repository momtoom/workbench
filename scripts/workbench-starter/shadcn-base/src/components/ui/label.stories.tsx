import { Label as ShadcnLabel } from './label';
import { asText } from './story-utils';

type Args = {
  children?: boolean | string;
};

const DEFAULT_PROPS = {
  children: 'Field label',
} as const;

const meta = {
  title: 'shadcn/Base UI/Label',
  component: ShadcnLabel,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Label = {
  name: 'Label',
  render: (args: Args) => (
    <ShadcnLabel>{asText(args.children, DEFAULT_PROPS.children)}</ShadcnLabel>
  ),
};
