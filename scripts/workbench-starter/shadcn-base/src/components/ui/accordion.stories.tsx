import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from './accordion';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  contentGap?: boolean | string;
  contentSize?: boolean | string;
  contentTone?: boolean | string;
  contentWeight?: boolean | string;
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  multiple?: boolean | string;
  showDividers?: boolean | string;
  title?: boolean | string;
  titleSize?: boolean | string;
  titleTone?: boolean | string;
  titleWeight?: boolean | string;
  value?: boolean | string;
};

const GAP_OPTIONS = ['none', 'xs', 'sm', 'md', 'lg'] as const;
const SIZE_OPTIONS = ['xs', 'sm', 'md', 'lg', 'xl', 'display'] as const;
const TONE_OPTIONS = ['default', 'muted', 'accent', 'danger', 'onAccent'] as const;
const WEIGHT_OPTIONS = ['regular', 'medium', 'semibold', 'bold'] as const;

const DEFAULT_PROPS = {
  defaultValue: '',
  disabled: false,
  className: 'w-full',
  contentGap: 'sm',
  contentSize: 'sm',
  contentTone: 'default',
  contentWeight: 'regular',
  multiple: false,
  showDividers: true,
  titleSize: 'sm',
  titleTone: 'default',
  titleWeight: 'medium',
} as const;

const PANEL_DEFAULT_PROPS = {
  children: 'Content',
  title: 'Item',
  value: 'item-1',
} as const;

const ACCORDION_TYPOGRAPHY_ARG_TYPES = {
  contentGap: { control: 'select', options: GAP_OPTIONS },
  contentSize: { control: 'select', options: SIZE_OPTIONS },
  contentTone: { control: 'select', options: TONE_OPTIONS },
  contentWeight: { control: 'select', options: WEIGHT_OPTIONS },
  titleSize: { control: 'select', options: SIZE_OPTIONS },
  titleTone: { control: 'select', options: TONE_OPTIONS },
  titleWeight: { control: 'select', options: WEIGHT_OPTIONS },
} as const;

function parseAccordionDefaultValue(value: string): string[] | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '[]') return undefined;

  const bracketMatch = trimmed.match(/^\[(.*)\]$/);
  const rawItems = bracketMatch ? bracketMatch[1] : trimmed;
  const items = rawItems
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

const meta = {
  title: 'shadcn/Base UI/Accordion',
  component: ShadcnAccordion,
  authoring: {
    group: 'Layout',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    className: { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    multiple: { control: 'boolean' },
    showDividers: { control: 'boolean' },
    ...ACCORDION_TYPOGRAPHY_ARG_TYPES,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AccordionPanel'],
        sourceFile: 'src/components/ui/accordion.tsx',
      },
    ],
    jsxChildren:
      '<AccordionPanel value="item-1" title="Item 1"><p>Content 1</p></AccordionPanel><AccordionPanel value="item-2" title="Item 2"><p>Content 2</p></AccordionPanel>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Accordion = {
  name: 'Accordion',
  render: (args: Args) => (
    <ShadcnAccordion
      className={asText(args.className, 'w-[min(28rem,100%)]')}
      contentGap={asOption(args.contentGap, GAP_OPTIONS, DEFAULT_PROPS.contentGap)}
      contentSize={asOption(args.contentSize, SIZE_OPTIONS, DEFAULT_PROPS.contentSize)}
      contentTone={asOption(args.contentTone, TONE_OPTIONS, DEFAULT_PROPS.contentTone)}
      contentWeight={asOption(args.contentWeight, WEIGHT_OPTIONS, DEFAULT_PROPS.contentWeight)}
      defaultValue={parseAccordionDefaultValue(asText(args.defaultValue, DEFAULT_PROPS.defaultValue))}
      disabled={asBoolean(args.disabled)}
      multiple={asBoolean(args.multiple)}
      showDividers={asBoolean(args.showDividers, DEFAULT_PROPS.showDividers)}
      titleSize={asOption(args.titleSize, SIZE_OPTIONS, DEFAULT_PROPS.titleSize)}
      titleTone={asOption(args.titleTone, TONE_OPTIONS, DEFAULT_PROPS.titleTone)}
      titleWeight={asOption(args.titleWeight, WEIGHT_OPTIONS, DEFAULT_PROPS.titleWeight)}
    >
      <AccordionPanel value="item-1" title="Item 1"><p>Content 1</p></AccordionPanel>
      <AccordionPanel value="item-2" title="Item 2"><p>Content 2</p></AccordionPanel>
    </ShadcnAccordion>
  ),
};

export const AccordionPanelStory = {
  name: 'AccordionPanel',
  args: PANEL_DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    title: { control: 'text' },
    value: { control: 'text' },
  },
  sourceInsert: {
    props: PANEL_DEFAULT_PROPS,
  },
  render: (args: Args) => (
    <ShadcnAccordion className="w-[min(28rem,100%)]" defaultValue={['item-1']}>
      <AccordionPanel
        title={asText(args.title, PANEL_DEFAULT_PROPS.title)}
        value={asText(args.value, PANEL_DEFAULT_PROPS.value)}
      >
        {asText(args.children, PANEL_DEFAULT_PROPS.children)}
      </AccordionPanel>
    </ShadcnAccordion>
  ),
};

export const AccordionItemStory = {
  name: 'AccordionItem',
  sourceInsert: {
    imports: [
      {
        names: ['AccordionTrigger', 'AccordionContent'],
        sourceFile: 'src/components/ui/accordion.tsx',
      },
    ],
    jsxChildren:
      '<AccordionTrigger>Item title</AccordionTrigger><AccordionContent>Item content</AccordionContent>',
    props: {
      value: 'item-1',
    },
  },
  render: () => (
    <ShadcnAccordion className="w-[min(28rem,100%)]" defaultValue={['item-1']}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Item title</AccordionTrigger>
        <AccordionContent>Item content</AccordionContent>
      </AccordionItem>
    </ShadcnAccordion>
  ),
};

export const AccordionTriggerStory = {
  name: 'AccordionTrigger',
  sourceInsert: {
    props: {
      children: 'Item title',
    },
  },
  render: () => (
    <ShadcnAccordion className="w-[min(28rem,100%)]" defaultValue={['item-1']}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Item title</AccordionTrigger>
        <AccordionContent>Item content</AccordionContent>
      </AccordionItem>
    </ShadcnAccordion>
  ),
};

export const AccordionContentStory = {
  name: 'AccordionContent',
  sourceInsert: {
    props: {
      children: 'Item content',
    },
  },
  render: () => (
    <ShadcnAccordion className="w-[min(28rem,100%)]" defaultValue={['item-1']}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Item title</AccordionTrigger>
        <AccordionContent>Item content</AccordionContent>
      </AccordionItem>
    </ShadcnAccordion>
  ),
};
