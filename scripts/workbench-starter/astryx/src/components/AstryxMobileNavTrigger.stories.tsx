import { AstryxButton } from './AstryxButton';
import { AstryxMobileNavTrigger as Component } from './AstryxMobileNavTrigger';

const meta = {
  title: 'Astryx/MobileNavTrigger',
  component: Component,
  authoring: {
    allowedChildren: ['AstryxButton'],
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: {},
    jsxChildren: '<AstryxButton label="Open navigation" variant="secondary" />',
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
    ],
  },
};
export default meta;

export const AstryxMobileNavTrigger = {
  name: 'AstryxMobileNavTrigger',
  render: () => (
    <Component>
      <AstryxButton label="Open navigation" variant="secondary" />
    </Component>
  ),
};
