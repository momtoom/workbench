import { AstryxTable } from './AstryxTable';
import { AstryxTableHead } from './AstryxTableHead';
import { AstryxTableHeader as AstryxTableHeaderComponent } from './AstryxTableHeader';
import { AstryxTableRow } from './AstryxTableRow';

const meta = {
  title: 'Astryx/TableHeader',
  component: AstryxTableHeaderComponent,
  authoring: {
    allowedChildren: ['AstryxTableRow'],
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxTableHead'],
        sourceFile: 'src/components/AstryxTableHead.tsx',
      },
      {
        names: ['AstryxTableRow'],
        sourceFile: 'src/components/AstryxTableRow.tsx',
      },
    ],
    props: {},
    jsxChildren:
      '<AstryxTableRow isHeaderRow>\n' +
      '  <AstryxTableHead>Metric</AstryxTableHead>\n' +
      '  <AstryxTableHead>Status</AstryxTableHead>\n' +
      '</AstryxTableRow>',
  },
};
export default meta;

export const AstryxTableHeader = {
  name: 'AstryxTableHeader',
  render: () => (
    <AstryxTable>
      <AstryxTableHeaderComponent>
        <AstryxTableRow isHeaderRow>
          <AstryxTableHead>Metric</AstryxTableHead>
          <AstryxTableHead>Status</AstryxTableHead>
        </AstryxTableRow>
      </AstryxTableHeaderComponent>
    </AstryxTable>
  ),
};
