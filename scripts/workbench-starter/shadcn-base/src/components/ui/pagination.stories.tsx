import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

const meta = {
  title: 'shadcn/Base UI/Pagination',
  component: ShadcnPagination,
  authoring: {
    group: 'Navigation',
  },
  sourceInsert: {
    imports: [
      {
        names: ['PaginationPrevious', 'PaginationLink', 'PaginationNext'],
        sourceFile: 'src/components/ui/pagination.tsx',
      },
    ],
    jsxChildren:
      '<PaginationPrevious href="#" /><PaginationLink href="#" isActive>1</PaginationLink><PaginationNext href="#" />',
    props: {
      'aria-label': 'Pagination',
    },
  },
};
export default meta;

export const Pagination = {
  name: 'Pagination',
  render: () => (
    <ShadcnPagination aria-label="Pagination">
      <PaginationPrevious href="#" />
      <PaginationLink href="#" isActive>1</PaginationLink>
      <PaginationNext href="#" />
    </ShadcnPagination>
  ),
};

export const PaginationContentStory = {
  name: 'PaginationContent',
  sourceInsert: {
    imports: [
      {
        names: ['PaginationItem', 'PaginationLink'],
        sourceFile: 'src/components/ui/pagination.tsx',
      },
    ],
    jsxChildren: '<PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>',
  },
  render: () => <ShadcnPagination><PaginationContent><PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem></PaginationContent></ShadcnPagination>,
};

export const PaginationItemStory = {
  name: 'PaginationItem',
  sourceInsert: {
    imports: [
      {
        names: ['PaginationLink'],
        sourceFile: 'src/components/ui/pagination.tsx',
      },
    ],
    jsxChildren: '<PaginationLink href="#">1</PaginationLink>',
  },
  render: () => <ShadcnPagination><PaginationContent><PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem></PaginationContent></ShadcnPagination>,
};

export const PaginationLinkStory = {
  name: 'PaginationLink',
  sourceInsert: {
    props: {
      children: '1',
      href: '#',
    },
  },
  render: () => <ShadcnPagination><PaginationContent><PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem></PaginationContent></ShadcnPagination>,
};

export const PaginationPreviousStory = {
  name: 'PaginationPrevious',
  sourceInsert: {
    props: {
      href: '#',
    },
  },
  render: () => <ShadcnPagination><PaginationContent><PaginationItem><PaginationPrevious href="#" /></PaginationItem></PaginationContent></ShadcnPagination>,
};

export const PaginationNextStory = {
  name: 'PaginationNext',
  sourceInsert: {
    props: {
      href: '#',
    },
  },
  render: () => <ShadcnPagination><PaginationContent><PaginationItem><PaginationNext href="#" /></PaginationItem></PaginationContent></ShadcnPagination>,
};

export const PaginationEllipsisStory = {
  name: 'PaginationEllipsis',
  sourceInsert: {},
  render: () => <ShadcnPagination><PaginationContent><PaginationItem><PaginationEllipsis /></PaginationItem></PaginationContent></ShadcnPagination>,
};
