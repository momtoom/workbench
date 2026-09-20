import { AstryxButton } from './AstryxButton';
import { AstryxToastActions as Component } from './AstryxToastActions';

const meta = {
  title: 'Astryx/ToastActions',
  component: Component,
  authoring: {
    group: 'Feedback',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
    ],
    jsxChildren: '<AstryxButton label="Undo" size="sm" variant="ghost" />',
  },
};

export default meta;
export const AstryxToastActions = {
  name: 'AstryxToastActions',
  render: () => (
    <Component>
      <AstryxButton label="Undo" size="sm" variant="ghost" />
    </Component>
  ),
};
