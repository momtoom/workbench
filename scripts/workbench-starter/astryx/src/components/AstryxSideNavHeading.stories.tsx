import { AstryxBadge } from './AstryxBadge';
import { ASTRYX_NAV_BRAND_DISPLAYS, ASTRYX_NAV_COLLAPSED_BRAND_DISPLAYS } from './AstryxNavBrand';
import { AstryxSideNavHeading as AstryxSideNavHeadingComponent } from './AstryxSideNavHeading';

type Args = Record<string, string>;

const ICONS = ['none', 'component', 'menu', 'settings', 'viewColumns'] as const;

const DEFAULT_PROPS = {
  icon: 'component',
  brandDisplay: 'signature',
  collapsedBrandDisplay: 'symbol',
  heading: 'Astryx',
  headingHref: '#',
  logoAlt: '',
  logoSrc: '',
  logoText: 'Astryx',
  subheading: 'Component library',
  subheadingHref: '',
  superheading: 'Workbench',
  superheadingHref: '',
  symbolAlt: '',
  symbolSrc: '',
} as const;

const meta = {
  title: 'Astryx/SideNavHeading',
  component: AstryxSideNavHeadingComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    icon: { control: 'icon', name: 'Symbol icon', options: ICONS },
    brandDisplay: { control: 'select', options: ASTRYX_NAV_BRAND_DISPLAYS },
    collapsedBrandDisplay: { control: 'select', options: ASTRYX_NAV_COLLAPSED_BRAND_DISPLAYS },
    heading: { control: 'text' },
    headingHref: { control: 'text' },
    logoAlt: { control: 'text' },
    logoSrc: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Logo image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    logoText: { control: 'text' },
    subheading: { control: 'text' },
    subheadingHref: { control: 'text' },
    superheading: { control: 'text' },
    superheadingHref: { control: 'text' },
    symbolAlt: { control: 'text' },
    symbolSrc: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Symbol image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxBadge'], sourceFile: 'src/components/AstryxBadge.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxBadge label="89" variant="success" />',
  },
};
export default meta;

export const AstryxSideNavHeading = {
  name: 'AstryxSideNavHeading',
  render: (args: Args) => (
    <AstryxSideNavHeadingComponent
      heading={asText(args.heading, DEFAULT_PROPS.heading)}
      headingHref={asText(args.headingHref, DEFAULT_PROPS.headingHref)}
      brandDisplay={asOption(args.brandDisplay, ASTRYX_NAV_BRAND_DISPLAYS, DEFAULT_PROPS.brandDisplay)}
      collapsedBrandDisplay={asOption(
        args.collapsedBrandDisplay,
        ASTRYX_NAV_COLLAPSED_BRAND_DISPLAYS,
        DEFAULT_PROPS.collapsedBrandDisplay,
      )}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      logoAlt={asText(args.logoAlt)}
      logoSrc={asText(args.logoSrc)}
      logoText={asText(args.logoText, DEFAULT_PROPS.logoText)}
      subheading={asText(args.subheading, DEFAULT_PROPS.subheading)}
      subheadingHref={asText(args.subheadingHref)}
      symbolAlt={asText(args.symbolAlt)}
      symbolSrc={asText(args.symbolSrc)}
      superheading={asText(args.superheading, DEFAULT_PROPS.superheading)}
      superheadingHref={asText(args.superheadingHref)}
    >
      <AstryxBadge label="89" variant="success" />
    </AstryxSideNavHeadingComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
