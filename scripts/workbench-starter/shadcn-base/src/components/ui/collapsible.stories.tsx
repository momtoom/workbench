import {
  Collapsible as ShadcnCollapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import { asBoolean, asText } from './story-utils';

type Args = {
  defaultOpen?: boolean | string;
  trigger?: boolean | string;
};

const DEFAULT_PROPS = {
  defaultOpen: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Collapsible',
  component: ShadcnCollapsible,
  authoring: {
    group: 'Layout',
  },
  args: {
    ...DEFAULT_PROPS,
    trigger: 'Advanced details',
  },
  argTypes: {
    trigger: { control: 'text' },
    defaultOpen: { control: 'boolean' },
  },
  sourceInsert: {
    jsxChildren:
      'Hidden implementation details.',
    props: {
      trigger: 'Advanced details',
      defaultOpen: true,
    },
  },
};
export default meta;

export const Collapsible = {
  name: 'Collapsible',
  render: (args: Args) => (
    <ShadcnCollapsible
      key={String(asBoolean(args.defaultOpen, true))}
      className="flex w-[min(24rem,100%)] flex-col gap-2 rounded-lg border p-3"
      defaultOpen={asBoolean(args.defaultOpen, true)}
      trigger={asText(args.trigger, 'Advanced details')}
      triggerClassName="text-left text-sm font-medium"
      contentClassName="text-sm text-muted-foreground"
    >
      Hidden implementation details.
    </ShadcnCollapsible>
  ),
};

export const CollapsibleTriggerStory = {
  name: 'CollapsibleTrigger',
  sourceInsert: {
    props: {
      children: 'Advanced details',
    },
  },
  render: () => (
    <ShadcnCollapsible defaultOpen>
      <CollapsibleTrigger>Advanced details</CollapsibleTrigger>
      <CollapsibleContent>Hidden implementation details.</CollapsibleContent>
    </ShadcnCollapsible>
  ),
};

export const CollapsibleContentStory = {
  name: 'CollapsibleContent',
  sourceInsert: {
    props: {
      children: 'Hidden implementation details.',
    },
  },
  render: () => (
    <ShadcnCollapsible defaultOpen>
      <CollapsibleTrigger>Advanced details</CollapsibleTrigger>
      <CollapsibleContent>Hidden implementation details.</CollapsibleContent>
    </ShadcnCollapsible>
  ),
};
