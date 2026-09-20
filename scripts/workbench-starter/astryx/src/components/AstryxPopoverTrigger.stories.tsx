import { AstryxButton } from './AstryxButton';
import { AstryxPopoverTrigger as AstryxPopoverTriggerComponent } from './AstryxPopoverTrigger';

const meta = {
  title: 'Astryx/PopoverTrigger',
  component: AstryxPopoverTriggerComponent,
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: {},
    jsxChildren: '<AstryxButton label="Open popover" />',
  },
};
export default meta;

export const AstryxPopoverTrigger = {
  name: 'AstryxPopoverTrigger',
  render: () => (
    <AstryxPopoverTriggerComponent>
      <AstryxButton label="Open popover" />
    </AstryxPopoverTriggerComponent>
  ),
};
