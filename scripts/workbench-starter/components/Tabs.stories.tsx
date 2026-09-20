import {
  Tabs as WorkbenchTabs,
  TabsContent as WorkbenchTabsContent,
  TabsList as WorkbenchTabsList,
  TabsTrigger as WorkbenchTabsTrigger,
} from './Tabs';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  defaultValue: 'account',
  accountLabel: 'Account',
  passwordLabel: 'Password',
} as const;

const meta = {
  title: 'Local/Tabs',
  component: WorkbenchTabs,
  authoring: {
    roles: ['navigation.tabs'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    accountLabel: { control: 'text' },
    passwordLabel: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['TabsList', 'TabsTrigger', 'TabsContent'],
        sourceFile: 'src/components/Tabs.tsx',
      },
    ],
    jsxChildren: '<TabsList>\n  <TabsTrigger value="account">Account</TabsTrigger>\n  <TabsTrigger value="password">Password</TabsTrigger>\n</TabsList>\n<TabsContent value="account">Make changes to your account here.</TabsContent>\n<TabsContent value="password">Update your password here.</TabsContent>',
    props: {
      defaultValue: DEFAULT_PROPS.defaultValue,
    },
  },
};
export default meta;

export const Tabs = {
  name: 'Tabs',
  render: (args: Args) => (
    <WorkbenchTabs defaultValue={asText(args.defaultValue, 'account')}>
      <WorkbenchTabsList>
        <WorkbenchTabsTrigger value="account">{asText(args.accountLabel, 'Account')}</WorkbenchTabsTrigger>
        <WorkbenchTabsTrigger value="password">{asText(args.passwordLabel, 'Password')}</WorkbenchTabsTrigger>
      </WorkbenchTabsList>
      <WorkbenchTabsContent value="account">Make changes to your account here.</WorkbenchTabsContent>
      <WorkbenchTabsContent value="password">Update your password here.</WorkbenchTabsContent>
    </WorkbenchTabs>
  ),
};

export const TabsList = {
  name: 'TabsList',
  render: () => (
    <WorkbenchTabs defaultValue="account">
      <WorkbenchTabsList>
        <WorkbenchTabsTrigger value="account">Account</WorkbenchTabsTrigger>
        <WorkbenchTabsTrigger value="password">Password</WorkbenchTabsTrigger>
      </WorkbenchTabsList>
    </WorkbenchTabs>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['TabsTrigger'],
        sourceFile: 'src/components/Tabs.tsx',
      },
    ],
    jsxChildren: '<TabsTrigger value="account">Account</TabsTrigger>\n<TabsTrigger value="password">Password</TabsTrigger>',
  },
};

export const TabsTrigger = {
  name: 'TabsTrigger',
  render: () => (
    <WorkbenchTabs defaultValue="account">
      <WorkbenchTabsList>
        <WorkbenchTabsTrigger value="account">Account</WorkbenchTabsTrigger>
      </WorkbenchTabsList>
    </WorkbenchTabs>
  ),
  sourceInsert: {
    jsxChildren: 'Account',
    props: {
      value: 'account',
    },
  },
};

export const TabsContent = {
  name: 'TabsContent',
  render: () => (
    <WorkbenchTabs defaultValue="account">
      <WorkbenchTabsContent value="account">Make changes to your account here.</WorkbenchTabsContent>
    </WorkbenchTabs>
  ),
  sourceInsert: {
    jsxChildren: 'Make changes to your account here.',
    props: {
      value: 'account',
    },
  },
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
