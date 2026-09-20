import { AstryxText } from './AstryxText';
import { AstryxToastBody as Component } from './AstryxToastBody';

const meta = {
  title: 'Astryx/ToastBody',
  component: Component,
  authoring: {
    group: 'Feedback',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    jsxChildren:
      '<AstryxText color="primary">Your changes were saved.</AstryxText>',
  },
};

export default meta;
export const AstryxToastBody = {
  name: 'AstryxToastBody',
  render: () => (
    <Component>
      <AstryxText color="primary">Your changes were saved.</AstryxText>
    </Component>
  ),
};
