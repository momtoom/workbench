import { AstryxButton } from './AstryxButton';
import { AstryxText } from './AstryxText';
import { AstryxToast as Component } from './AstryxToast';
import { AstryxToastActions } from './AstryxToastActions';
import { AstryxToastBody } from './AstryxToastBody';

type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  type: 'info',
  autoHideDuration: 5000,
  isAutoHide: false,
  isDefaultVisible: true,
  launcherLabel: 'Show notification',
} as const;

const TOAST_CHILDREN = `<AstryxToastBody>
  <AstryxText color="primary">Your changes were saved.</AstryxText>
</AstryxToastBody>
<AstryxToastActions>
  <AstryxButton label="Undo" size="sm" variant="ghost" />
</AstryxToastActions>`;

const meta = {
  title: 'Astryx/Toast',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    type: { control: 'select', options: ['info', 'error'] },
    autoHideDuration: { control: 'number' },
    isAutoHide: { control: 'boolean' },
    isDefaultVisible: { control: 'boolean' },
    launcherLabel: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxToastBody', 'AstryxToastActions'],
    group: 'Feedback',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxToastBody'], sourceFile: 'src/components/AstryxToastBody.tsx' },
      { names: ['AstryxToastActions'], sourceFile: 'src/components/AstryxToastActions.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: TOAST_CHILDREN,
  },
};

export default meta;
export const AstryxToast = {
  name: 'AstryxToast',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxToastBody>
        <AstryxText color="primary">Your changes were saved.</AstryxText>
      </AstryxToastBody>
      <AstryxToastActions>
        <AstryxButton label="Undo" size="sm" variant="ghost" />
      </AstryxToastActions>
    </Component>
  ),
};
