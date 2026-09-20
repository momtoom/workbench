import { Button } from './button';
import {
  Dialog as ShadcnDialog,
  DialogAction,
  DialogCancel,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogPreset,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Icon } from './icon';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  actionText?: boolean | string;
  cancelText?: boolean | string;
  children?: boolean | string;
  defaultOpen?: boolean | string;
  description?: boolean | string;
  media?: boolean | string;
  showAction?: boolean | string;
  showCancel?: boolean | string;
  showCloseButton?: boolean | string;
  showFooter?: boolean | string;
  showTrigger?: boolean | string;
  size?: boolean | string;
  title?: boolean | string;
  trigger?: boolean | string;
  variant?: boolean | string;
};

const BUTTON_SIZES = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;
const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const CONTENT_SIZES = ['default', 'sm'] as const;

const DEFAULT_PROPS = {
  title: 'Dialog title',
  description: 'Make changes to this dialog and confirm when you are ready.',
  size: 'default',
  actionText: 'Save changes',
  cancelText: 'Cancel',
  defaultOpen: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Dialog',
  component: ShadcnDialog,
  authoring: {
    group: 'Overlays',
  },
  args: {
    ...DEFAULT_PROPS,
    showAction: true,
    showCancel: true,
    showCloseButton: false,
    showFooter: true,
    showTrigger: false,
    size: 'default',
    trigger: 'Open dialog',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    trigger: { control: 'text' },
    showCancel: { control: 'boolean' },
    showFooter: { control: 'boolean' },
    size: { control: 'select', options: CONTENT_SIZES },
    actionText: { control: 'text' },
    cancelText: { control: 'text' },
    defaultOpen: { control: 'boolean' },
    showAction: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    showTrigger: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'DialogContent',
          'DialogHeader',
          'DialogTitle',
          'DialogDescription',
          'DialogFooter',
          'DialogCancel',
          'DialogAction',
        ],
        sourceFile: 'src/components/ui/dialog.tsx',
      },
    ],
    jsxChildren:
      '<DialogContent size="default" showCloseButton={false}><DialogHeader><DialogTitle>Dialog title</DialogTitle><DialogDescription>Make changes to this dialog and confirm when you are ready.</DialogDescription></DialogHeader><DialogFooter><DialogCancel>Cancel</DialogCancel><DialogAction>Save changes</DialogAction></DialogFooter></DialogContent>',
    props: {
      defaultOpen: true,
    },
  },
};
export default meta;

export const Dialog = {
  name: 'Dialog',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnDialog
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
      >
        {asBoolean(args.showTrigger, false) ? (
          <DialogTrigger variant="outline">
            {asText(args.trigger, 'Open dialog')}
          </DialogTrigger>
        ) : null}
        <DialogContent
          size={asOption(args.size, CONTENT_SIZES, DEFAULT_PROPS.size)}
          showCloseButton={asBoolean(args.showCloseButton, false)}
        >
          <DialogHeader>
            <DialogTitle>{asText(args.title, DEFAULT_PROPS.title)}</DialogTitle>
            <DialogDescription>{asText(args.description, DEFAULT_PROPS.description)}</DialogDescription>
          </DialogHeader>
          {asBoolean(args.showFooter, true) ? (
            <DialogFooter>
              {asBoolean(args.showCancel, true) ? (
                <DialogCancel>
                  {asText(args.cancelText, DEFAULT_PROPS.cancelText)}
                </DialogCancel>
              ) : null}
              {asBoolean(args.showAction, true) ? (
                <DialogAction>{asText(args.actionText, DEFAULT_PROPS.actionText)}</DialogAction>
              ) : null}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </ShadcnDialog>
    );
  },
};

export const DialogPresetStory = {
  name: 'DialogPreset',
  args: {
    title: DEFAULT_PROPS.title,
    description: DEFAULT_PROPS.description,
    size: 'default',
    actionText: 'Save changes',
    cancelText: 'Cancel',
    defaultOpen: true,
    media: '',
    showCloseButton: false,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    size: { control: 'select', options: CONTENT_SIZES },
    actionText: { control: 'text' },
    cancelText: { control: 'text' },
    defaultOpen: { control: 'boolean' },
    media: { control: 'text' },
    showCloseButton: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['DialogCancel', 'DialogAction'],
        sourceFile: 'src/components/ui/dialog.tsx',
      },
      {
        names: ['Icon'],
        sourceFile: 'src/components/ui/icon.tsx',
      },
    ],
    jsxProps: {
      media: '<Icon name="circle-fading-plus" size={20} />',
    },
    jsxChildren:
      '<DialogCancel>Cancel</DialogCancel><DialogAction>Save changes</DialogAction>',
    props: {
      title: 'Dialog title',
      description: 'Make changes to this dialog and confirm when you are ready.',
      size: 'default',
      showCloseButton: false,
    },
  },
  render: (args: Args) => {
    const media = asText(args.media);
    return (
      <ShadcnDialog key={String(asBoolean(args.defaultOpen, true))} defaultOpen={asBoolean(args.defaultOpen, true)}>
        <DialogPreset
          description={asText(args.description, DEFAULT_PROPS.description)}
          media={media || <Icon name="circle-fading-plus" size={20} />}
          showCloseButton={asBoolean(args.showCloseButton, false)}
          size={asOption(args.size, CONTENT_SIZES, DEFAULT_PROPS.size)}
          title={asText(args.title, DEFAULT_PROPS.title)}
        >
          <DialogCancel>
            {asText(args.cancelText, DEFAULT_PROPS.cancelText)}
          </DialogCancel>
          <DialogAction>{asText(args.actionText, DEFAULT_PROPS.actionText)}</DialogAction>
        </DialogPreset>
      </ShadcnDialog>
    );
  },
};

export const DialogTriggerStory = {
  name: 'DialogTrigger',
  args: {
    children: 'Open dialog',
    variant: 'outline',
    size: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'select', options: BUTTON_SIZES },
  },
  sourceInsert: {
    props: {
      children: 'Open dialog',
      variant: 'outline',
      size: 'default',
    },
  },
  render: (args: Args) => (
    <ShadcnDialog>
      <DialogTrigger
        size={asOption(args.size, BUTTON_SIZES, 'default')}
        variant={asOption(args.variant, BUTTON_VARIANTS, 'outline')}
      >
        {asText(args.children, 'Open dialog')}
      </DialogTrigger>
      <DialogContent><DialogTitle>Dialog</DialogTitle></DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogContentStory = {
  name: 'DialogContent',
  args: {
    size: 'default',
    showCloseButton: false,
  },
  argTypes: {
    size: { control: 'select', options: CONTENT_SIZES },
    showCloseButton: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter'],
        sourceFile: 'src/components/ui/dialog.tsx',
      },
    ],
    jsxChildren:
      '<DialogHeader><DialogTitle>Dialog title</DialogTitle><DialogDescription>Dialog description</DialogDescription></DialogHeader><DialogFooter>Ready</DialogFooter>',
    props: {
      size: 'default',
      showCloseButton: false,
    },
  },
  render: (args: Args) => (
    <ShadcnDialog defaultOpen>
      <DialogContent
        size={asOption(args.size, CONTENT_SIZES, 'default')}
        showCloseButton={asBoolean(args.showCloseButton, false)}
      >
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>Ready</DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogHeaderStory = {
  name: 'DialogHeader',
  sourceInsert: {
    imports: [
      {
        names: ['DialogTitle', 'DialogDescription'],
        sourceFile: 'src/components/ui/dialog.tsx',
      },
    ],
    jsxChildren:
      '<DialogTitle>Dialog title</DialogTitle><DialogDescription>Dialog description</DialogDescription>',
  },
  render: () => (
    <ShadcnDialog defaultOpen>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogMediaStory = {
  name: 'DialogMedia',
  sourceInsert: {
    imports: [
      {
        names: ['Icon'],
        sourceFile: 'src/components/ui/icon.tsx',
      },
    ],
    jsxChildren: '<Icon name="circle-fading-plus" size={20} />',
  },
  render: () => (
    <ShadcnDialog defaultOpen>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogMedia><Icon name="circle-fading-plus" size={20} /></DialogMedia>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogFooterStory = {
  name: 'DialogFooter',
  args: {
    children: 'Ready',
    showCloseButton: false,
  },
  argTypes: {
    children: { control: 'text' },
    showCloseButton: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      children: 'Ready',
      showCloseButton: false,
    },
  },
  render: (args: Args) => (
    <DialogFooter showCloseButton={asBoolean(args.showCloseButton, false)}>
      {asText(args.children, 'Ready')}
    </DialogFooter>
  ),
};

export const DialogCancelStory = {
  name: 'DialogCancel',
  args: {
    children: 'Cancel',
    variant: 'outline',
    size: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'select', options: BUTTON_SIZES },
  },
  sourceInsert: { props: { children: 'Cancel', variant: 'outline', size: 'default' } },
  render: (args: Args) => (
    <ShadcnDialog defaultOpen>
      <DialogContent>
        <DialogFooter>
          <DialogCancel
            size={asOption(args.size, BUTTON_SIZES, 'default')}
            variant={asOption(args.variant, BUTTON_VARIANTS, 'outline')}
          >
            {asText(args.children, 'Cancel')}
          </DialogCancel>
        </DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogActionStory = {
  name: 'DialogAction',
  args: {
    children: 'Confirm',
    variant: 'default',
    size: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'select', options: BUTTON_SIZES },
  },
  sourceInsert: { props: { children: 'Confirm', variant: 'default', size: 'default' } },
  render: (args: Args) => (
    <ShadcnDialog defaultOpen>
      <DialogContent>
        <DialogFooter>
          <DialogAction
            size={asOption(args.size, BUTTON_SIZES, 'default')}
            variant={asOption(args.variant, BUTTON_VARIANTS, 'default')}
          >
            {asText(args.children, 'Confirm')}
          </DialogAction>
        </DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogTitleStory = {
  name: 'DialogTitle',
  sourceInsert: {
    jsxChildren: 'Dialog title',
  },
  render: () => (
    <ShadcnDialog defaultOpen>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogDescriptionStory = {
  name: 'DialogDescription',
  sourceInsert: {
    jsxChildren: 'Dialog description',
  },
  render: () => (
    <ShadcnDialog defaultOpen>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </ShadcnDialog>
  ),
};

export const DialogCloseStory = {
  name: 'DialogClose',
  sourceInsert: {
    jsxProps: {
      render: '<button type="button" />',
    },
    props: {
      children: 'Close',
    },
  },
  render: () => (
    <ShadcnDialog defaultOpen>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Close dialog</DialogTitle>
          <DialogDescription>DialogClose must live inside a dialog root.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  ),
};
