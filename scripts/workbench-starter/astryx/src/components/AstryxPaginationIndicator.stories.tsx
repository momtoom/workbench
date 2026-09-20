import { AstryxPagination } from './AstryxPagination';
import { AstryxPaginationIndicator as Component } from './AstryxPaginationIndicator';

const DEFAULT_PROPS = {
  variant: 'compact',
  ofLabel: 'of',
  pageLabel: 'Page',
} as const;

const meta = {
  title: 'Astryx/PaginationIndicator',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    variant: {
      control: 'select',
      options: ['pages', 'count', 'compact', 'dots', 'none'],
    },
    ofLabel: { control: 'text' },
    pageLabel: { control: 'text' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;

export const AstryxPaginationIndicator = {
  name: 'AstryxPaginationIndicator',
  render: (args: typeof DEFAULT_PROPS) => (
    <AstryxPagination page={2} pageSize={10} totalItems={80} totalPages={8}>
      <Component {...args} />
    </AstryxPagination>
  ),
};
