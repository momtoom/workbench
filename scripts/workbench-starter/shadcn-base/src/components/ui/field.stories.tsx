import { Checkbox } from './checkbox';
import {
  Field as ShadcnField,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field';
import { Input } from './input';
import { asBoolean } from './story-utils';

type Args = {
  'data-invalid'?: boolean | string;
};

const DEFAULT_PROPS = {
  'data-invalid': false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Field',
  component: ShadcnField,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    'data-invalid': { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['FieldLabel', 'FieldDescription'],
        sourceFile: 'src/components/ui/field.tsx',
      },
      {
        names: ['Input'],
        sourceFile: 'src/components/ui/input.tsx',
      },
    ],
    jsxChildren: '<FieldLabel>Name</FieldLabel><Input placeholder="Enter a name" /><FieldDescription>Helper text</FieldDescription>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Field = {
  name: 'Field',
  render: (args: Args) => (
    <ShadcnField data-invalid={asBoolean(args['data-invalid'])}>
      <FieldLabel>Name</FieldLabel>
      <Input placeholder="Enter a name" />
      <FieldDescription>Helper text</FieldDescription>
    </ShadcnField>
  ),
};

export const FieldSetStory = {
  name: 'FieldSet',
  sourceInsert: {
    imports: [
      {
        names: ['FieldLegend', 'FieldGroup', 'Field', 'FieldLabel', 'FieldDescription'],
        sourceFile: 'src/components/ui/field.tsx',
      },
      {
        names: ['Input'],
        sourceFile: 'src/components/ui/input.tsx',
      },
    ],
    jsxChildren: '<FieldLegend>Details</FieldLegend><FieldGroup><Field><FieldLabel>Name</FieldLabel><Input placeholder="Enter a name" /><FieldDescription>Helper text</FieldDescription></Field></FieldGroup>',
  },
  render: () => (
    <FieldSet>
      <FieldLegend>Details</FieldLegend>
      <FieldGroup>
        <ShadcnField>
          <FieldLabel>Name</FieldLabel>
          <Input placeholder="Enter a name" />
          <FieldDescription>Helper text</FieldDescription>
        </ShadcnField>
      </FieldGroup>
    </FieldSet>
  ),
};

export const FieldLegendStory = {
  name: 'FieldLegend',
  sourceInsert: {
    props: {
      children: 'Details',
    },
  },
  render: () => <FieldSet><FieldLegend>Details</FieldLegend></FieldSet>,
};

export const FieldGroupStory = {
  name: 'FieldGroup',
  sourceInsert: {
    imports: [
      {
        names: ['Field', 'FieldLabel', 'FieldDescription'],
        sourceFile: 'src/components/ui/field.tsx',
      },
      {
        names: ['Input'],
        sourceFile: 'src/components/ui/input.tsx',
      },
    ],
    jsxChildren: '<Field><FieldLabel>Name</FieldLabel><Input placeholder="Enter a name" /><FieldDescription>Helper text</FieldDescription></Field>',
  },
  render: () => (
    <FieldGroup>
      <ShadcnField>
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="Enter a name" />
        <FieldDescription>Helper text</FieldDescription>
      </ShadcnField>
    </FieldGroup>
  ),
};

export const FieldLabelStory = {
  name: 'FieldLabel',
  sourceInsert: {
    props: {
      children: 'Name',
    },
  },
  render: () => <ShadcnField><FieldLabel>Name</FieldLabel></ShadcnField>,
};

export const FieldContentStory = {
  name: 'FieldContent',
  sourceInsert: {
    imports: [
      {
        names: ['FieldTitle', 'FieldDescription'],
        sourceFile: 'src/components/ui/field.tsx',
      },
    ],
    jsxChildren: '<FieldTitle>Title</FieldTitle><FieldDescription>Description</FieldDescription>',
  },
  render: () => (
    <ShadcnField orientation="horizontal">
      <Checkbox />
      <FieldContent>
        <FieldTitle>Title</FieldTitle>
        <FieldDescription>Description</FieldDescription>
      </FieldContent>
    </ShadcnField>
  ),
};

export const FieldTitleStory = {
  name: 'FieldTitle',
  sourceInsert: {
    props: {
      children: 'Title',
    },
  },
  render: () => <ShadcnField><FieldTitle>Title</FieldTitle></ShadcnField>,
};

export const FieldDescriptionStory = {
  name: 'FieldDescription',
  sourceInsert: {
    props: {
      children: 'Description',
    },
  },
  render: () => <ShadcnField><FieldDescription>Description</FieldDescription></ShadcnField>,
};

export const FieldSeparatorStory = {
  name: 'FieldSeparator',
  sourceInsert: {
    props: {
      children: 'or',
    },
  },
  render: () => <FieldGroup><FieldSeparator>or</FieldSeparator></FieldGroup>,
};

export const FieldErrorStory = {
  name: 'FieldError',
  sourceInsert: {
    props: {
      children: 'Name is required.',
    },
  },
  render: () => <ShadcnField data-invalid><FieldError>Name is required.</FieldError></ShadcnField>,
};
