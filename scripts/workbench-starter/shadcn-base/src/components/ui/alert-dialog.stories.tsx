import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
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
  showMedia?: boolean | string;
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
  title: 'Are you absolutely sure?',
  description: 'This action cannot be undone. This will permanently delete your account from our servers.',
  size: 'default',
  defaultOpen: true,
  showMedia: true,
  showTrigger: false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Alert Dialog',
  component: ShadcnAlertDialog,
  authoring: {
    group: 'Overlays',
  },
  args: {
    ...DEFAULT_PROPS,
    // The render falls back to these; without them the Inspector shows the
    // controls empty while the dialog renders the fallback text.
    trigger: 'Open alert dialog',
    media: '!',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    trigger: { control: 'text' },
    size: { control: 'select', options: CONTENT_SIZES },
    defaultOpen: { control: 'boolean' },
    media: { control: 'text' },
    showMedia: { control: 'boolean' },
    showTrigger: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'AlertDialogTrigger',
          'AlertDialogContent',
          'AlertDialogHeader',
          'AlertDialogMedia',
          'AlertDialogTitle',
          'AlertDialogDescription',
          'AlertDialogFooter',
          'AlertDialogCancel',
          'AlertDialogAction',
        ],
        sourceFile: 'src/components/ui/alert-dialog.tsx',
      },
    ],
    jsxChildren:
      '<AlertDialogTrigger variant="outline">Open alert dialog</AlertDialogTrigger><AlertDialogContent size="default"><AlertDialogHeader><AlertDialogMedia>!</AlertDialogMedia><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your account from our servers.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Continue</AlertDialogAction></AlertDialogFooter></AlertDialogContent>',
    props: {
      defaultOpen: true,
    },
  },
};
export default meta;

export const AlertDialog = {
  name: 'AlertDialog',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    const showMedia = asBoolean(args.showMedia, true);
    const showTrigger = asBoolean(args.showTrigger, false);
    return (
      <ShadcnAlertDialog
        key={`${String(defaultOpen)}-${String(showTrigger)}-${asText(args.title, DEFAULT_PROPS.title)}-${asText(args.description, DEFAULT_PROPS.description)}`}
        defaultOpen={defaultOpen}
      >
        {showTrigger ? (
          <AlertDialogTrigger variant="outline">
            {asText(args.trigger, 'Open alert dialog')}
          </AlertDialogTrigger>
        ) : null}
        <AlertDialogContent size={asOption(args.size, CONTENT_SIZES, 'default')}>
          <AlertDialogHeader>
            {showMedia ? <AlertDialogMedia>{asText(args.media, '!')}</AlertDialogMedia> : null}
            <AlertDialogTitle>{asText(args.title, DEFAULT_PROPS.title)}</AlertDialogTitle>
            <AlertDialogDescription>{asText(args.description, DEFAULT_PROPS.description)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </ShadcnAlertDialog>
    );
  },
};

export const AlertDialogTriggerStory = {
  name: 'AlertDialogTrigger',
  args: {
    children: 'Open alert dialog',
    variant: 'outline',
    size: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'select', options: BUTTON_SIZES },
  },
  sourceInsert: {
    props: { children: 'Open alert dialog', variant: 'outline', size: 'default' },
  },
  render: (args: Args) => (
    <ShadcnAlertDialog>
      <AlertDialogTrigger
        size={asOption(args.size, BUTTON_SIZES, 'default')}
        variant={asOption(args.variant, BUTTON_VARIANTS, 'outline')}
      >
        {asText(args.children, 'Open alert dialog')}
      </AlertDialogTrigger>
      <AlertDialogContent><AlertDialogTitle>Alert dialog</AlertDialogTitle></AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogContentStory = {
  name: 'AlertDialogContent',
  args: {
    size: 'default',
  },
  argTypes: {
    size: { control: 'select', options: CONTENT_SIZES },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AlertDialogHeader', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction'],
        sourceFile: 'src/components/ui/alert-dialog.tsx',
      },
    ],
    jsxChildren:
      '<AlertDialogHeader><AlertDialogTitle>Continue?</AlertDialogTitle><AlertDialogDescription>This action will continue.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Confirm</AlertDialogAction></AlertDialogFooter>',
    props: {
      size: 'default',
    },
  },
  render: (args: Args) => (
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent size={asOption(args.size, CONTENT_SIZES, 'default')}>
        <AlertDialogHeader>
          <AlertDialogTitle>Continue?</AlertDialogTitle>
          <AlertDialogDescription>This action will continue.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogHeaderStory = {
  name: 'AlertDialogHeader',
  sourceInsert: {
    imports: [
      {
        names: ['AlertDialogTitle', 'AlertDialogDescription'],
        sourceFile: 'src/components/ui/alert-dialog.tsx',
      },
    ],
    jsxChildren:
      '<AlertDialogTitle>Continue?</AlertDialogTitle><AlertDialogDescription>This action will continue.</AlertDialogDescription>',
  },
  render: () => (
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Continue?</AlertDialogTitle>
          <AlertDialogDescription>This action will continue.</AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogFooterStory = {
  name: 'AlertDialogFooter',
  sourceInsert: {
    imports: [
      {
        names: ['AlertDialogCancel', 'AlertDialogAction'],
        sourceFile: 'src/components/ui/alert-dialog.tsx',
      },
    ],
    jsxChildren: '<AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Confirm</AlertDialogAction>',
  },
  render: () => (
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogTitleStory = {
  name: 'AlertDialogTitle',
  sourceInsert: {
    jsxChildren: 'Continue?',
  },
  render: () => (
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Continue?</AlertDialogTitle>
        </AlertDialogHeader>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogDescriptionStory = {
  name: 'AlertDialogDescription',
  sourceInsert: {
    jsxChildren: 'This action will continue.',
  },
  render: () => (
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Continue?</AlertDialogTitle>
          <AlertDialogDescription>This action will continue.</AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogMediaStory = {
  name: 'AlertDialogMedia',
  sourceInsert: { props: { children: '!' } },
  render: () => (
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>!</AlertDialogMedia>
          <AlertDialogTitle>Continue?</AlertDialogTitle>
          <AlertDialogDescription>This action will continue.</AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogCancelStory = {
  name: 'AlertDialogCancel',
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
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogFooter>
          <AlertDialogCancel
            size={asOption(args.size, BUTTON_SIZES, 'default')}
            variant={asOption(args.variant, BUTTON_VARIANTS, 'outline')}
          >
            {asText(args.children, 'Cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};

export const AlertDialogActionStory = {
  name: 'AlertDialogAction',
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
    <ShadcnAlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogFooter>
          <AlertDialogAction
            size={asOption(args.size, BUTTON_SIZES, 'default')}
            variant={asOption(args.variant, BUTTON_VARIANTS, 'default')}
          >
            {asText(args.children, 'Confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  ),
};
