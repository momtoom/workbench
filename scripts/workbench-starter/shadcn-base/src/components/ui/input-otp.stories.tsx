import {
  InputOTP,
  InputOTPDigitGroup,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './input-otp';
import { asNumber, asText } from './story-utils';

type Args = {
  count?: number | string;
  defaultValue?: boolean | string;
  maxLength?: number | string;
};

const DEFAULT_PROPS = {
  defaultValue: '123456',
  maxLength: 6,
} as const;

const meta = {
  title: 'shadcn/Base UI/InputOTP',
  component: InputOTP,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    maxLength: { control: { type: 'number', min: 1, max: 12, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['InputOTPDigitGroup', 'InputOTPSeparator'],
        sourceFile: 'src/components/ui/input-otp.tsx',
      },
    ],
    jsxChildren:
      '<InputOTPDigitGroup count={3} /><InputOTPSeparator /><InputOTPDigitGroup count={3} />',
    props: {
      defaultValue: DEFAULT_PROPS.defaultValue,
      maxLength: DEFAULT_PROPS.maxLength,
    },
  },
};
export default meta;

export const Default = {
  name: 'InputOTP',
  render: (args: Args) => {
    const maxLength = asNumber(args.maxLength, DEFAULT_PROPS.maxLength, { min: 1, max: 12 });
    return (
      <InputOTP
        key={`${maxLength}-${asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}`}
        defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue).slice(0, maxLength)}
        maxLength={maxLength}
      >
        <InputOTPDigitGroup count={3} />
        <InputOTPSeparator />
        <InputOTPDigitGroup count={3} />
      </InputOTP>
    );
  },
};

export const InputOTPDigitGroupStory = {
  name: 'InputOTPDigitGroup',
  args: {
    count: 3,
  },
  authoring: {
    allowedChildren: ['InputOTPSlot', 'InputOTPSeparator'],
    group: 'Inputs',
  },
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 12, step: 1 } },
  },
  sourceInsert: {
    props: {
      count: 3,
    },
  },
  render: (args: Args) => (
    <InputOTP defaultValue="123456" maxLength={6}>
      <InputOTPDigitGroup count={asNumber(args.count, 3, { min: 1, max: 12 })} />
    </InputOTP>
  ),
};

export const InputOTPGroupStory = {
  name: 'InputOTPGroup',
  sourceInsert: {
    imports: [
      {
        names: ['InputOTPSlot'],
        sourceFile: 'src/components/ui/input-otp.tsx',
      },
    ],
    jsxChildren: '<InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />',
  },
  render: () => (
    <InputOTP defaultValue="123" maxLength={3}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const InputOTPSlotStory = {
  name: 'InputOTPSlot',
  sourceInsert: {
    props: {
      index: 0,
    },
  },
  render: () => (
    <InputOTP defaultValue="1" maxLength={1}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const InputOTPSeparatorStory = {
  name: 'InputOTPSeparator',
  sourceInsert: {
    componentName: 'InputOTPSeparator',
  },
  render: () => (
    <InputOTP defaultValue="12" maxLength={2}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={1} />
      </InputOTPGroup>
    </InputOTP>
  ),
};
