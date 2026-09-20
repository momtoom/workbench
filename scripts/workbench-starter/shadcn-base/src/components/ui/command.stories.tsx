import * as React from 'react';
import {
  Command as ShadcnCommand,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandOption,
  CommandSection,
  CommandSeparator,
  CommandShortcut,
} from './command';
import { asBoolean, asText } from './story-utils';

type Args = {
  children?: boolean | string;
  heading?: boolean | string;
  placeholder?: boolean | string;
  shortcut?: boolean | string;
  value?: boolean | string;
};

type DialogArgs = {
  dialogOpen?: boolean | string;
};

const DEFAULT_DIALOG_PROPS = {
  dialogOpen: true,
} as const;

const DEFAULT_PROPS = {
  className: 'w-[360px] border shadow-sm',
} as const;
const DEFAULT_COMMAND_INPUT_PLACEHOLDER = 'Placeholder';

const meta = {
  title: 'shadcn/Base UI/Command',
  component: ShadcnCommand,
  authoring: {
    group: 'Overlays',
  },
  args: DEFAULT_PROPS,
  sourceInsert: {
    imports: [
      {
        names: ['CommandEmpty', 'CommandInput', 'CommandList', 'CommandSection', 'CommandOption'],
        sourceFile: 'src/components/ui/command.tsx',
      },
    ],
    jsxChildren:
      '<CommandInput placeholder="Placeholder" /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandSection heading="Options"><CommandOption value="item-1" shortcut="⌘1">Item 1</CommandOption><CommandOption value="item-2" shortcut="⌘2">Item 2</CommandOption></CommandSection></CommandList>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

function CommandDialogPreview({ dialogOpen }: DialogArgs) {
  const requestedOpen = asBoolean(dialogOpen, DEFAULT_DIALOG_PROPS.dialogOpen);
  const [open, setOpen] = React.useState(requestedOpen);

  React.useEffect(() => {
    setOpen(requestedOpen);
  }, [requestedOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton>
      <ShadcnCommand>
        <CommandInput placeholder="Search..." />
        <CommandList><CommandItem value="item-1">Item</CommandItem></CommandList>
      </ShadcnCommand>
    </CommandDialog>
  );
}

export const Command = {
  name: 'Command',
  render: () => (
    <ShadcnCommand
      className={DEFAULT_PROPS.className}
    >
      <CommandInput placeholder={DEFAULT_COMMAND_INPUT_PLACEHOLDER} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandSection heading="Options">
          <CommandOption value="item-1" shortcut="⌘1">Item 1</CommandOption>
          <CommandOption value="item-2" shortcut="⌘2">Item 2</CommandOption>
        </CommandSection>
      </CommandList>
    </ShadcnCommand>
  ),
};

export const CommandSectionStory = {
  name: 'CommandSection',
  args: {
    heading: 'Options',
  },
  argTypes: {
    heading: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['CommandOption'],
        sourceFile: 'src/components/ui/command.tsx',
      },
    ],
    jsxChildren: '<CommandOption value="item-1">Item</CommandOption>',
    props: {
      heading: 'Options',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList>
        <CommandSection heading={asText(args.heading, 'Options')}>
          <CommandOption value="item-1">Item</CommandOption>
        </CommandSection>
      </CommandList>
    </ShadcnCommand>
  ),
};

export const CommandOptionStory = {
  name: 'CommandOption',
  args: {
    children: 'Item',
    value: 'item-1',
    shortcut: '⌘1',
  },
  argTypes: {
    children: { control: 'text' },
    value: { control: 'text' },
    shortcut: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
      shortcut: '⌘1',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList>
        <CommandOption
          shortcut={asText(args.shortcut, '⌘1')}
          value={asText(args.value, 'item-1')}
        >
          {asText(args.children, 'Item')}
        </CommandOption>
      </CommandList>
    </ShadcnCommand>
  ),
};

export const CommandDialogStory = {
  name: 'CommandDialog',
  args: { ...DEFAULT_DIALOG_PROPS, defaultOpen: true },
  argTypes: {
    defaultOpen: { control: 'boolean' },
    dialogOpen: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['Command', 'CommandInput', 'CommandList', 'CommandItem'],
        sourceFile: 'src/components/ui/command.tsx',
      },
    ],
    jsxChildren:
      '<Command><CommandInput placeholder="Search..." /><CommandList><CommandItem value="item-1">Item</CommandItem></CommandList></Command>',
    props: {
      defaultOpen: true,
    },
  },
  render: (args: DialogArgs) => <CommandDialogPreview {...args} />,
};

export const CommandInputStory = {
  name: 'CommandInput',
  args: {
    placeholder: 'Search...',
  },
  argTypes: {
    placeholder: { control: 'text' },
  },
  sourceInsert: {
    props: {
      placeholder: 'Search...',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandInput placeholder={asText(args.placeholder, 'Search...')} />
    </ShadcnCommand>
  ),
};

export const CommandListStory = {
  name: 'CommandList',
  sourceInsert: {
    imports: [
      {
        names: ['CommandItem'],
        sourceFile: 'src/components/ui/command.tsx',
      },
    ],
    jsxChildren: '<CommandItem value="item-1">Item</CommandItem>',
  },
  render: () => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList><CommandItem value="item-1">Item</CommandItem></CommandList>
    </ShadcnCommand>
  ),
};

export const CommandEmptyStory = {
  name: 'CommandEmpty',
  args: {
    children: 'No results found.',
  },
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'No results found.',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList><CommandEmpty>{asText(args.children, 'No results found.')}</CommandEmpty></CommandList>
    </ShadcnCommand>
  ),
};

export const CommandGroupStory = {
  name: 'CommandGroup',
  args: {
    heading: 'Options',
  },
  argTypes: {
    heading: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['CommandItem'],
        sourceFile: 'src/components/ui/command.tsx',
      },
    ],
    jsxChildren: '<CommandItem value="item-1">Item</CommandItem>',
    props: {
      heading: 'Options',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList>
        <CommandGroup heading={asText(args.heading, 'Options')}>
          <CommandItem value="item-1">Item</CommandItem>
        </CommandGroup>
      </CommandList>
    </ShadcnCommand>
  ),
};

export const CommandItemStory = {
  name: 'CommandItem',
  args: {
    children: 'Item',
    value: 'item-1',
  },
  argTypes: {
    children: { control: 'text' },
    value: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList>
        <CommandItem value={asText(args.value, 'item-1')}>
          {asText(args.children, 'Item')}
        </CommandItem>
      </CommandList>
    </ShadcnCommand>
  ),
};

export const CommandSeparatorStory = {
  name: 'CommandSeparator',
  sourceInsert: {},
  render: () => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList>
        <CommandItem value="item-1">Item 1</CommandItem>
        <CommandSeparator />
        <CommandItem value="item-2">Item 2</CommandItem>
      </CommandList>
    </ShadcnCommand>
  ),
};

export const CommandShortcutStory = {
  name: 'CommandShortcut',
  args: {
    children: '⌘1',
  },
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: '⌘1',
    },
  },
  render: (args: Args) => (
    <ShadcnCommand className="w-72 border p-1">
      <CommandList>
        <CommandItem value="item-1">
          Item
          <CommandShortcut>{asText(args.children, '⌘1')}</CommandShortcut>
        </CommandItem>
      </CommandList>
    </ShadcnCommand>
  ),
};
