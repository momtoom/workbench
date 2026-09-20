import { AstryxButton } from './AstryxButton';
import { AstryxHoverCardTrigger as AstryxHoverCardTriggerComponent } from './AstryxHoverCardTrigger';

const meta = {
  title: 'Astryx/HoverCardTrigger',
  component: AstryxHoverCardTriggerComponent,
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: {},
    jsxChildren: '<AstryxButton label="Hover preview" />',
  },
};
export default meta;

export const AstryxHoverCardTrigger = {
  name: 'AstryxHoverCardTrigger',
  render: () => (
    <AstryxHoverCardTriggerComponent>
      <AstryxButton label="Hover preview" />
    </AstryxHoverCardTriggerComponent>
  ),
};
