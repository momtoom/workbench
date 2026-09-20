import { Button } from './button';
import { Toaster, ToastTrigger, TOAST_TYPES } from './toast';
import { asNumber, asOption, asText } from './story-utils';

type Args = {
  actionLabel?: boolean | string;
  description?: boolean | string;
  duration?: boolean | number | string;
  title?: boolean | string;
  toastType?: boolean | string;
};

const meta = {
  title: 'shadcn/Base UI/Toast',
  component: ToastTrigger,
  authoring: {
    group: 'Feedback',
  },
  args: {
    title: 'Component catalog updated',
    description: 'The latest component variants are ready to review.',
    duration: 5000,
    toastType: 'success',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    duration: { control: 'number' },
    actionLabel: { control: 'text' },
    toastType: { control: 'select', options: TOAST_TYPES },
  },
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button slot="trigger" variant="outline">Show toast</Button>',
    props: {
      title: 'Component catalog updated',
      description: 'The latest component variants are ready to review.',
      duration: 5000,
      toastType: 'success',
    },
  },
};
export default meta;

export const Default = {
  name: 'ToastTrigger',
  render: (args: Args) => (
    <>
      <Toaster />
      <ToastTrigger
        actionLabel={asText(args.actionLabel, '')}
        description={asText(args.description, 'The latest component variants are ready to review.')}
        duration={asNumber(args.duration, 5000)}
        title={asText(args.title, 'Component catalog updated')}
        toastType={asOption(args.toastType, TOAST_TYPES, 'success')}
      >
        <Button slot="trigger" variant="outline">Show toast</Button>
      </ToastTrigger>
    </>
  ),
};

export const ToasterStory = {
  name: 'Toaster',
  render: () => <Toaster />,
};

export const ActionToast = {
  name: 'ToastTrigger / action',
  args: {
    title: 'Event created',
    description: 'Sunday, December 3 at 9:00 AM',
    actionLabel: 'Undo',
    toastType: 'default',
  },
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button slot="trigger" variant="outline">Create event</Button>',
    props: {
      title: 'Event created',
      description: 'Sunday, December 3 at 9:00 AM',
      actionLabel: 'Undo',
      toastType: 'default',
    },
  },
  render: (args: Args) => (
    <>
      <Toaster />
      <ToastTrigger
        actionLabel={asText(args.actionLabel, 'Undo')}
        description={asText(args.description, 'Sunday, December 3 at 9:00 AM')}
        duration={asNumber(args.duration, 5000)}
        title={asText(args.title, 'Event created')}
        toastType={asOption(args.toastType, TOAST_TYPES, 'default')}
      >
        <Button slot="trigger" variant="outline">Create event</Button>
      </ToastTrigger>
    </>
  ),
};

export const ErrorToast = {
  name: 'ToastTrigger / error',
  args: {
    title: 'Unable to save component',
    description: 'Check the component source and try again.',
    toastType: 'error',
  },
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button slot="trigger" variant="destructive">Show error toast</Button>',
    props: {
      title: 'Unable to save component',
      description: 'Check the component source and try again.',
      toastType: 'error',
    },
  },
  render: (args: Args) => (
    <>
      <Toaster />
      <ToastTrigger
        actionLabel={asText(args.actionLabel, '')}
        description={asText(args.description, 'Check the component source and try again.')}
        duration={asNumber(args.duration, 5000)}
        title={asText(args.title, 'Unable to save component')}
        toastType={asOption(args.toastType, TOAST_TYPES, 'error')}
      >
        <Button slot="trigger" variant="destructive">Show error toast</Button>
      </ToastTrigger>
    </>
  ),
};

export const LoadingToast = {
  name: 'ToastTrigger / loading',
  args: {
    title: 'Publishing components',
    description: 'Reconciling the component registry.',
    toastType: 'loading',
  },
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button slot="trigger" variant="outline">Show loading toast</Button>',
    props: {
      title: 'Publishing components',
      description: 'Reconciling the component registry.',
      toastType: 'loading',
    },
  },
  render: (args: Args) => (
    <>
      <Toaster />
      <ToastTrigger
        actionLabel={asText(args.actionLabel, '')}
        description={asText(args.description, 'Reconciling the component registry.')}
        duration={asNumber(args.duration, 5000)}
        title={asText(args.title, 'Publishing components')}
        toastType={asOption(args.toastType, TOAST_TYPES, 'loading')}
      >
        <Button slot="trigger" variant="outline">Show loading toast</Button>
      </ToastTrigger>
    </>
  ),
};
