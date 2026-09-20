import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  ariaLabel?: boolean | string;
  children?: boolean | string;
  className?: boolean | string;
  href?: boolean | string;
  separator?: boolean | string;
  showEllipsis?: boolean | string;
};

const SEPARATORS = ['chevron', 'slash', 'dot'] as const;

const DEFAULT_PROPS = {
  ariaLabel: 'Breadcrumb',
  separator: 'chevron',
  className: '',
  showEllipsis: false,
} as const;

const rootArgTypes = {
  ariaLabel: { control: 'text' },
  className: { control: 'text' },
  separator: { control: 'select', options: SEPARATORS },
  showEllipsis: { control: 'boolean' },
} as const;

const classNameArgType = { control: 'text' } as const;
const textArgType = { control: 'text' } as const;

const meta = {
  title: 'shadcn/Base UI/Breadcrumb',
  component: ShadcnBreadcrumb,
  authoring: {
    group: 'Navigation',
  },
  args: DEFAULT_PROPS,
  argTypes: rootArgTypes,
  sourceInsert: {
    imports: [
      {
        names: ['BreadcrumbLink', 'BreadcrumbPage'],
        sourceFile: 'src/components/ui/breadcrumb.tsx',
      },
    ],
    jsxChildren:
      '<BreadcrumbLink href="#">Home</BreadcrumbLink><BreadcrumbLink href="#">Parent</BreadcrumbLink><BreadcrumbPage>Current page</BreadcrumbPage>',
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Breadcrumb = {
  name: 'Breadcrumb',
  args: DEFAULT_PROPS,
  argTypes: rootArgTypes,
  sourceInsert: {
    imports: [
      {
        names: ['BreadcrumbLink', 'BreadcrumbPage'],
        sourceFile: 'src/components/ui/breadcrumb.tsx',
      },
    ],
    jsxChildren:
      '<BreadcrumbLink href="#">Home</BreadcrumbLink><BreadcrumbLink href="#">Parent</BreadcrumbLink><BreadcrumbPage>Current page</BreadcrumbPage>',
    props: DEFAULT_PROPS,
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb
      ariaLabel={asText(args.ariaLabel, DEFAULT_PROPS.ariaLabel)}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      separator={asOption(args.separator, SEPARATORS, DEFAULT_PROPS.separator)}
      showEllipsis={asBoolean(args.showEllipsis, DEFAULT_PROPS.showEllipsis)}
    >
      <BreadcrumbLink href="#">Home</BreadcrumbLink>
      <BreadcrumbLink href="#">Parent</BreadcrumbLink>
      <BreadcrumbPage>Current page</BreadcrumbPage>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbCompound = {
  name: 'Breadcrumb compound',
  sourceInsert: {
    imports: [
      {
        names: ['BreadcrumbList', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbSeparator', 'BreadcrumbPage'],
        sourceFile: 'src/components/ui/breadcrumb.tsx',
      },
    ],
    jsxChildren:
      '<BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Current page</BreadcrumbPage></BreadcrumbItem></BreadcrumbList>',
    props: {
      'aria-label': 'Breadcrumb',
      className: '',
    },
  },
  render: () => (
    <ShadcnBreadcrumb aria-label="Breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Current page</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbListStory = {
  name: 'BreadcrumbList',
  args: {
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    className: classNameArgType,
  },
  sourceInsert: {
    imports: [
      {
        names: ['BreadcrumbItem', 'BreadcrumbPage'],
        sourceFile: 'src/components/ui/breadcrumb.tsx',
      },
    ],
    jsxChildren: '<BreadcrumbItem><BreadcrumbPage>Current page</BreadcrumbPage></BreadcrumbItem>',
    props: {
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb>
      <BreadcrumbList className={asText(args.className, DEFAULT_PROPS.className) || undefined}>
        <BreadcrumbItem><BreadcrumbPage>Current page</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbItemStory = {
  name: 'BreadcrumbItem',
  args: {
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    className: classNameArgType,
  },
  sourceInsert: {
    imports: [
      {
        names: ['BreadcrumbPage'],
        sourceFile: 'src/components/ui/breadcrumb.tsx',
      },
    ],
    jsxChildren: '<BreadcrumbPage>Current page</BreadcrumbPage>',
    props: {
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className={asText(args.className, DEFAULT_PROPS.className) || undefined}>
          <BreadcrumbPage>Current page</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbLinkStory = {
  name: 'BreadcrumbLink',
  args: {
    children: 'Page link',
    href: '#',
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    children: textArgType,
    href: textArgType,
    className: classNameArgType,
  },
  sourceInsert: {
    props: {
      children: 'Page link',
      href: '#',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb>
      <BreadcrumbLink
        className={asText(args.className, DEFAULT_PROPS.className) || undefined}
        href={asText(args.href, '#')}
      >
        {asText(args.children, 'Page link')}
      </BreadcrumbLink>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbPageStory = {
  name: 'BreadcrumbPage',
  args: {
    children: 'Current page',
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    children: textArgType,
    className: classNameArgType,
  },
  sourceInsert: {
    props: {
      children: 'Current page',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb>
      <BreadcrumbPage className={asText(args.className, DEFAULT_PROPS.className) || undefined}>
        {asText(args.children, 'Current page')}
      </BreadcrumbPage>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbSeparatorStory = {
  name: 'BreadcrumbSeparator',
  args: {
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    className: classNameArgType,
  },
  sourceInsert: {
    props: {
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#">Parent</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator className={asText(args.className, DEFAULT_PROPS.className) || undefined} />
        <BreadcrumbItem><BreadcrumbPage>Child</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbCustomSeparator = {
  name: 'Breadcrumb custom separator',
  args: {
    separator: 'slash',
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    separator: { control: 'select', options: SEPARATORS },
    className: classNameArgType,
  },
  sourceInsert: {
    imports: [
      {
        names: ['BreadcrumbLink', 'BreadcrumbPage'],
        sourceFile: 'src/components/ui/breadcrumb.tsx',
      },
    ],
    jsxChildren:
      '<BreadcrumbLink href="#">Parent</BreadcrumbLink><BreadcrumbPage>Child</BreadcrumbPage>',
    props: {
      separator: 'slash',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      separator={asOption(args.separator, SEPARATORS, 'slash')}
    >
      <BreadcrumbLink href="#">Parent</BreadcrumbLink>
      <BreadcrumbPage>Child</BreadcrumbPage>
    </ShadcnBreadcrumb>
  ),
};

export const BreadcrumbEllipsisStory = {
  name: 'BreadcrumbEllipsis',
  args: {
    className: DEFAULT_PROPS.className,
  },
  argTypes: {
    className: classNameArgType,
  },
  sourceInsert: {
    props: {
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbEllipsis className={asText(args.className, DEFAULT_PROPS.className) || undefined} />
        </BreadcrumbItem>
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  ),
};
