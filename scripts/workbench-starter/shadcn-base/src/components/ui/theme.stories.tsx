import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Theme as ShadcnTheme } from './theme';
import { asOption } from './story-utils';

type Args = {
  as?: boolean | string;
  effect?: boolean | string;
  mode?: boolean | string;
  popover?: boolean | string;
  radius?: boolean | string;
  spacing?: boolean | string;
  surface?: boolean | string;
  theme?: boolean | string;
  typography?: boolean | string;
};

const MODES = ['inherit', 'auto', 'light', 'dark'] as const;
const SURFACES = ['inherit', 'none', 'background', 'card', 'muted'] as const;
const THEMES = ['inherit', 'neutral', 'slate', 'blue', 'rose', 'indigo', 'amber', 'violet'] as const;
const ELEMENTS = ['div', 'main', 'section', 'article', 'header', 'footer', 'aside'] as const;
const EFFECTS = ['inherit', 'auto', 'light', 'dark'] as const;
const POPOVERS = ['inherit', 'default', 'inverted'] as const;
const RADII = ['inherit', 'base', 'compact', 'flat'] as const;
const SPACING = ['inherit', 'base', 'compact'] as const;
const TYPOGRAPHY = ['inherit', 'base', 'compact'] as const;

const DEFAULT_PROPS = {
  as: 'section',
  radius: 'base',
  effect: 'auto',
  mode: 'auto',
  popover: 'default',
  spacing: 'base',
  surface: 'none',
  theme: 'neutral',
  typography: 'base',
} as const;

const meta = {
  title: 'shadcn/Base UI/Theme',
  component: ShadcnTheme,
  authoring: {
    group: 'Foundation',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    as: { control: 'select', options: ELEMENTS },
    radius: { control: 'select', options: RADII },
    effect: { control: 'select', options: EFFECTS },
    mode: { control: 'select', options: MODES },
    popover: { control: 'select', options: POPOVERS },
    spacing: { control: 'select', options: SPACING },
    surface: { control: 'select', options: SURFACES },
    theme: { control: 'select', options: THEMES },
    typography: { control: 'select', options: TYPOGRAPHY },
  },
  sourceInsert: {
    imports: [
      { names: ['Button'], sourceFile: 'src/components/ui/button.tsx' },
      {
        names: ['Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle'],
        sourceFile: 'src/components/ui/card.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<div className="grid gap-3"><div><h3 className="text-lg font-semibold">Scoped theme</h3><p className="text-sm text-muted-foreground">Components inside this wrapper inherit the selected semantic token modes.</p></div><Card><CardHeader><CardTitle>Card title</CardTitle><CardDescription>Switch preview appearance or edit Theme props.</CardDescription></CardHeader><CardContent><Button>Action</Button></CardContent></Card></div>',
  },
};
export default meta;

export const Theme = {
  name: 'Theme',
  render: (args: Args) => (
    <ShadcnTheme
      as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
      effect={asOption(args.effect, EFFECTS, DEFAULT_PROPS.effect)}
      mode={asOption(args.mode, MODES, DEFAULT_PROPS.mode)}
      popover={asOption(args.popover, POPOVERS, DEFAULT_PROPS.popover)}
      radius={asOption(args.radius, RADII, DEFAULT_PROPS.radius)}
      spacing={asOption(args.spacing, SPACING, DEFAULT_PROPS.spacing)}
      surface={asOption(args.surface, SURFACES, DEFAULT_PROPS.surface)}
      theme={asOption(args.theme, THEMES, DEFAULT_PROPS.theme)}
      typography={asOption(args.typography, TYPOGRAPHY, DEFAULT_PROPS.typography)}
    >
      <div className="grid gap-3">
        <div>
          <h3 className="text-lg font-semibold">Scoped theme</h3>
          <p className="text-sm text-muted-foreground">
            Components inside this wrapper inherit the selected semantic token modes.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Switch preview appearance or edit Theme props.</CardDescription>
          </CardHeader>
          <CardContent><Button>Action</Button></CardContent>
        </Card>
      </div>
    </ShadcnTheme>
  ),
};

export const InheritedTheme = {
  name: 'Inherited theme',
  args: {
    radius: 'inherit',
    effect: 'inherit',
    mode: 'inherit',
    popover: 'inherit',
    spacing: 'inherit',
    surface: 'inherit',
    theme: 'inherit',
    typography: 'inherit',
  },
  render: (args: Args) => (
    <ShadcnTheme
      effect="dark"
      mode="dark"
      popover="inverted"
      radius="compact"
      spacing="compact"
      surface="muted"
      theme="violet"
      typography="compact"
    >
      <ShadcnTheme
        as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
        effect={asOption(args.effect, EFFECTS, 'inherit')}
        mode={asOption(args.mode, MODES, 'inherit')}
        popover={asOption(args.popover, POPOVERS, 'inherit')}
        radius={asOption(args.radius, RADII, 'inherit')}
        spacing={asOption(args.spacing, SPACING, 'inherit')}
        surface={asOption(args.surface, SURFACES, 'inherit')}
        theme={asOption(args.theme, THEMES, 'inherit')}
        typography={asOption(args.typography, TYPOGRAPHY, 'inherit')}
      >
        <Card>
          <CardHeader>
            <CardTitle>Inherited scope</CardTitle>
            <CardDescription>
              Every theme prop follows the violet, compact, dark parent scope.
            </CardDescription>
          </CardHeader>
          <CardContent><Button>Inherited action</Button></CardContent>
        </Card>
      </ShadcnTheme>
    </ShadcnTheme>
  ),
};
