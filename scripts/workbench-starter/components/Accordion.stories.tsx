import {
  Accordion as WorkbenchAccordion,
  AccordionContent as WorkbenchAccordionContent,
  AccordionItem as WorkbenchAccordionItem,
  AccordionTrigger as WorkbenchAccordionTrigger,
} from './Accordion';

const DEFAULT_PROPS = {
  defaultValue: ['item-1'],
} as const;

const meta = {
  title: 'Local/Accordion',
  component: WorkbenchAccordion,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AccordionItem', 'AccordionTrigger', 'AccordionContent'],
        sourceFile: 'src/components/Accordion.tsx',
      },
    ],
    jsxChildren: '<AccordionItem value="item-1">\n  <AccordionTrigger>Component contract</AccordionTrigger>\n  <AccordionContent>Expose semantic props and keep visual styling in token-backed CSS.</AccordionContent>\n</AccordionItem>\n<AccordionItem value="item-2">\n  <AccordionTrigger>Preview behavior</AccordionTrigger>\n  <AccordionContent>Use browser-native semantics first, then promote richer behavior only when the preview runtime supports it.</AccordionContent>\n</AccordionItem>',
    props: {
      defaultValue: 'item-1',
    },
  },
};
export default meta;

export const Accordion = {
  name: 'Accordion',
  render: (args: { defaultValue?: string[] | string }) => (
    <WorkbenchAccordion defaultValue={normalizeDefaultValue(args.defaultValue)}>
      <WorkbenchAccordionItem value="item-1">
        <WorkbenchAccordionTrigger>Component contract</WorkbenchAccordionTrigger>
        <WorkbenchAccordionContent>Expose semantic props and keep visual styling in token-backed CSS.</WorkbenchAccordionContent>
      </WorkbenchAccordionItem>
      <WorkbenchAccordionItem value="item-2">
        <WorkbenchAccordionTrigger>Preview behavior</WorkbenchAccordionTrigger>
        <WorkbenchAccordionContent>Use browser-native semantics first, then promote richer behavior only when the preview runtime supports it.</WorkbenchAccordionContent>
      </WorkbenchAccordionItem>
    </WorkbenchAccordion>
  ),
};

export const AccordionItem = {
  name: 'AccordionItem',
  render: () => (
    <WorkbenchAccordion>
      <WorkbenchAccordionItem value="item-1">
        <WorkbenchAccordionTrigger>Accordion item</WorkbenchAccordionTrigger>
        <WorkbenchAccordionContent>Use inside Accordion with AccordionTrigger and AccordionContent.</WorkbenchAccordionContent>
      </WorkbenchAccordionItem>
    </WorkbenchAccordion>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['AccordionTrigger', 'AccordionContent'],
        sourceFile: 'src/components/Accordion.tsx',
      },
    ],
    jsxChildren: '<AccordionTrigger>Accordion item</AccordionTrigger>\n<AccordionContent>Use inside Accordion with AccordionTrigger and AccordionContent.</AccordionContent>',
    props: {
      value: 'item-1',
    },
  },
};

export const AccordionTrigger = {
  name: 'AccordionTrigger',
  render: () => (
    <WorkbenchAccordion>
      <WorkbenchAccordionItem value="item-1">
        <WorkbenchAccordionTrigger>Accordion trigger</WorkbenchAccordionTrigger>
        <WorkbenchAccordionContent>Trigger controls the item open state.</WorkbenchAccordionContent>
      </WorkbenchAccordionItem>
    </WorkbenchAccordion>
  ),
  sourceInsert: {
    jsxChildren: 'Accordion trigger',
  },
};

export const AccordionContent = {
  name: 'AccordionContent',
  render: () => (
    <WorkbenchAccordion>
      <WorkbenchAccordionItem value="item-1">
        <WorkbenchAccordionTrigger>Accordion content</WorkbenchAccordionTrigger>
        <WorkbenchAccordionContent>Content is revealed when its item is open.</WorkbenchAccordionContent>
      </WorkbenchAccordionItem>
    </WorkbenchAccordion>
  ),
  sourceInsert: {
    jsxChildren: 'Accordion content',
  },
};

function normalizeDefaultValue(value: readonly string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [...DEFAULT_PROPS.defaultValue];
}
