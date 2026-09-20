import { AstryxStepper } from './AstryxStepper';
import { AstryxStepperItem } from './AstryxStepperItem';
import { AstryxStepperRail as AstryxStepperRailComponent } from './AstryxStepperRail';

const meta = {
  title: 'Astryx/StepperRail',
  component: AstryxStepperRailComponent,
  authoring: {
    allowedChildren: ['AstryxStepperItem'],
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxStepperItem'],
        sourceFile: 'src/components/AstryxStepperItem.tsx',
      },
    ],
    jsxChildren:
      '<AstryxStepperItem label="Basics" state="complete" step={1} />\n<AstryxStepperItem label="Greeting" state="current" step={2} />\n<AstryxStepperItem label="Publish" state="upcoming" step={3} />',
  },
};
export default meta;

export const AstryxStepperRail = {
  name: 'AstryxStepperRail',
  render: () => (
    <AstryxStepper label="Stepper rail preview">
      <AstryxStepperRailComponent>
        <AstryxStepperItem label="Basics" state="complete" step={1} />
        <AstryxStepperItem label="Greeting" state="current" step={2} />
        <AstryxStepperItem label="Publish" state="upcoming" step={3} />
      </AstryxStepperRailComponent>
    </AstryxStepper>
  ),
};
