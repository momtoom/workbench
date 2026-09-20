import { AstryxPagination } from './AstryxPagination';
import { AstryxPaginationPageSize as Component } from './AstryxPaginationPageSize';

const DEFAULT_PROPS = {
  label: 'Items per page',
  size: 'md',
  isDisabled: false,
  options: '10, 25, 50',
} as const;

const meta = {
  title: 'Astryx/PaginationPageSize',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md'] },
    isDisabled: { control: 'boolean' },
    options: { control: 'text' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;

export const AstryxPaginationPageSize = {
  name: 'AstryxPaginationPageSize',
  render: (args: typeof DEFAULT_PROPS) => (
    <AstryxPagination page={2} pageSize={10} totalPages={8} variant="compact">
      <Component {...args} />
    </AstryxPagination>
  ),
};
