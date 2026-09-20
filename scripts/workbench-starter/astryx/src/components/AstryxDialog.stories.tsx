import { AstryxButton } from './AstryxButton';
import { AstryxDialog as Component } from './AstryxDialog';
import { AstryxHeading } from './AstryxHeading';
import { AstryxLayout } from './AstryxLayout';
import { AstryxLayoutContent } from './AstryxLayoutContent';
import { AstryxLayoutFooter } from './AstryxLayoutFooter';
import { AstryxLayoutHeader } from './AstryxLayoutHeader';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  variant: 'standard',
  padding: 4,
  width: '480px',
  maxHeight: '75vh',
  isDefaultOpen: true,
  isInline: true,
  launcherLabel: 'Open dialog',
  purpose: 'info',
} as const;

const DIALOG_CHILDREN = `<AstryxLayout padding="inherit">
  <AstryxLayoutHeader hasDivider>
    <AstryxStack gap="xs">
      <AstryxHeading level={2}>Review changes</AstryxHeading>
      <AstryxText color="secondary">Confirm the details before continuing.</AstryxText>
    </AstryxStack>
  </AstryxLayoutHeader>
  <AstryxLayoutContent>
    <AstryxText>Your changes are ready to publish. You can return and edit them at any time.</AstryxText>
  </AstryxLayoutContent>
  <AstryxLayoutFooter hasDivider>
    <AstryxStack direction="horizontal" gap="sm" justify="end">
      <AstryxButton label="Cancel" variant="ghost" />
      <AstryxButton label="Continue" variant="primary" />
    </AstryxStack>
  </AstryxLayoutFooter>
</AstryxLayout>`;

const meta = {
  title: 'Astryx/Dialog',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: ['standard', 'fullscreen'] },
    padding: { control: 'select', options: [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] },
    width: { control: 'text' },
    maxHeight: { control: 'text' },
    isDefaultOpen: { control: 'boolean' },
    isInline: { control: 'boolean' },
    launcherLabel: { control: 'text' },
    purpose: { control: 'select', options: ['required', 'form', 'info'] },
  },
  authoring: {
    allowedChildren: ['AstryxLayout'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxLayout'], sourceFile: 'src/components/AstryxLayout.tsx' },
      { names: ['AstryxLayoutHeader'], sourceFile: 'src/components/AstryxLayoutHeader.tsx' },
      { names: ['AstryxLayoutContent'], sourceFile: 'src/components/AstryxLayoutContent.tsx' },
      { names: ['AstryxLayoutFooter'], sourceFile: 'src/components/AstryxLayoutFooter.tsx' },
      { names: ['AstryxStack'], sourceFile: 'src/components/AstryxStack.tsx' },
      { names: ['AstryxHeading'], sourceFile: 'src/components/AstryxHeading.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: DIALOG_CHILDREN,
  },
};

export default meta;
export const AstryxDialog = {
  name: 'AstryxDialog',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxLayout padding="inherit">
        <AstryxLayoutHeader hasDivider>
          <AstryxStack gap="xs">
            <AstryxHeading level={2}>Review changes</AstryxHeading>
            <AstryxText color="secondary">Confirm the details before continuing.</AstryxText>
          </AstryxStack>
        </AstryxLayoutHeader>
        <AstryxLayoutContent>
          <AstryxText>Your changes are ready to publish. You can return and edit them at any time.</AstryxText>
        </AstryxLayoutContent>
        <AstryxLayoutFooter hasDivider>
          <AstryxStack direction="horizontal" gap="sm" justify="end">
            <AstryxButton label="Cancel" variant="ghost" />
            <AstryxButton label="Continue" variant="primary" />
          </AstryxStack>
        </AstryxLayoutFooter>
      </AstryxLayout>
    </Component>
  ),
};
