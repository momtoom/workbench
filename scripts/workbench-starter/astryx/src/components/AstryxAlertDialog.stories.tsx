import { AstryxAlertDialog as Component } from './AstryxAlertDialog';
import { AstryxButton } from './AstryxButton';
import { AstryxHeading } from './AstryxHeading';
import { AstryxLayout } from './AstryxLayout';
import { AstryxLayoutContent } from './AstryxLayoutContent';
import { AstryxLayoutFooter } from './AstryxLayoutFooter';
import { AstryxLayoutHeader } from './AstryxLayoutHeader';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  width: '400px',
  isDefaultOpen: true,
  isInline: true,
  launcherLabel: 'Open confirmation',
} as const;

const ALERT_CHILDREN = `<AstryxLayout padding="inherit">
  <AstryxLayoutHeader hasDivider>
    <AstryxHeading level={2}>Delete project?</AstryxHeading>
  </AstryxLayoutHeader>
  <AstryxLayoutContent>
    <AstryxText>This action cannot be undone. All project data will be permanently removed.</AstryxText>
  </AstryxLayoutContent>
  <AstryxLayoutFooter hasDivider>
    <AstryxStack direction="horizontal" gap="sm" justify="end">
      <AstryxButton label="Cancel" variant="ghost" />
      <AstryxButton label="Delete" variant="destructive" />
    </AstryxStack>
  </AstryxLayoutFooter>
</AstryxLayout>`;

const meta = {
  title: 'Astryx/AlertDialog',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    width: { control: 'text' },
    isDefaultOpen: { control: 'boolean' },
    isInline: { control: 'boolean' },
    launcherLabel: { control: 'text' },
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
    jsxChildren: ALERT_CHILDREN,
  },
};

export default meta;
export const AstryxAlertDialog = {
  name: 'AstryxAlertDialog',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxLayout padding="inherit">
        <AstryxLayoutHeader hasDivider>
          <AstryxHeading level={2}>Delete project?</AstryxHeading>
        </AstryxLayoutHeader>
        <AstryxLayoutContent>
          <AstryxText>
            This action cannot be undone. All project data will be permanently removed.
          </AstryxText>
        </AstryxLayoutContent>
        <AstryxLayoutFooter hasDivider>
          <AstryxStack direction="horizontal" gap="sm" justify="end">
            <AstryxButton label="Cancel" variant="ghost" />
            <AstryxButton label="Delete" variant="destructive" />
          </AstryxStack>
        </AstryxLayoutFooter>
      </AstryxLayout>
    </Component>
  ),
};
