import { AstryxField } from './AstryxField';
import { AstryxFormLayout as AstryxFormLayoutComponent } from './AstryxFormLayout';
import { AstryxTextInput } from './AstryxTextInput';

type Args = Record<string, string>;

const DIRECTIONS = ['vertical', 'horizontal', 'horizontal-labels'] as const;

const DEFAULT_PROPS = {
  direction: 'vertical',
} as const;

const meta = {
  title: 'Astryx/FormLayout',
  component: AstryxFormLayoutComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    direction: { control: 'select', options: DIRECTIONS },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxField'], sourceFile: 'src/components/AstryxField.tsx' },
      { names: ['AstryxTextInput'], sourceFile: 'src/components/AstryxTextInput.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxField inputID="project-name" label="Project name"><AstryxTextInput isLabelHidden label="Project name" defaultValue="Astryx PJ" /></AstryxField>\n<AstryxField inputID="project-slug" label="Slug"><AstryxTextInput isLabelHidden label="Slug" defaultValue="astryx-pj" /></AstryxField>',
  },
};
export default meta;

export const AstryxFormLayout = {
  name: 'AstryxFormLayout',
  render: (args: Args) => (
    <AstryxFormLayoutComponent direction={asOption(args.direction, DIRECTIONS, DEFAULT_PROPS.direction)}>
      <AstryxField inputID="project-name" label="Project name">
        <AstryxTextInput isLabelHidden label="Project name" defaultValue="Astryx PJ" />
      </AstryxField>
      <AstryxField inputID="project-slug" label="Slug">
        <AstryxTextInput isLabelHidden label="Slug" defaultValue="astryx-pj" />
      </AstryxField>
    </AstryxFormLayoutComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
