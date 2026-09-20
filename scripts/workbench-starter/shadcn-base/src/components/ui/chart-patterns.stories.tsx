import type * as React from 'react';

import {
  AreaChartCard as ShadcnAreaChartCard,
  BarChartCard as ShadcnBarChartCard,
  ComposedChartCard as ShadcnComposedChartCard,
  LineChartCard as ShadcnLineChartCard,
  PieChartCard as ShadcnPieChartCard,
  RadialChartCard as ShadcnRadialChartCard,
  RadarChartCard as ShadcnRadarChartCard,
  ScatterChartCard as ShadcnScatterChartCard,
} from './chart-patterns';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  badge?: boolean | string;
  barRadius?: number | string;
  categoryKey?: boolean | string;
  className?: boolean | string;
  cornerRadius?: number | string;
  curveType?: boolean | string;
  dataCsv?: boolean | string;
  description?: boolean | string;
  endAngle?: number | string;
  footerDescription?: boolean | string;
  footerTitle?: boolean | string;
  height?: number | string;
  hideIndicator?: boolean | string;
  hideLabel?: boolean | string;
  innerRadius?: number | string;
  layout?: boolean | string;
  nameKey?: boolean | string;
  outerRadius?: number | string;
  paddingAngle?: number | string;
  primaryColor?: boolean | string;
  primaryKey?: boolean | string;
  primaryLabel?: boolean | string;
  secondaryColor?: boolean | string;
  secondaryKey?: boolean | string;
  secondaryLabel?: boolean | string;
  seriesKey?: boolean | string;
  showArea?: boolean | string;
  showBars?: boolean | string;
  showDots?: boolean | string;
  showGrid?: boolean | string;
  showLine?: boolean | string;
  showLegend?: boolean | string;
  showRadiusAxis?: boolean | string;
  showSecondary?: boolean | string;
  showTooltip?: boolean | string;
  seriesCsv?: boolean | string;
  stacked?: boolean | string;
  startAngle?: number | string;
  strokeWidth?: number | string;
  title?: boolean | string;
  tooltipIndicator?: boolean | string;
  valueKey?: boolean | string;
  xKey?: boolean | string;
  yKey?: boolean | string;
  zKey?: boolean | string;
};

const CURVE_TYPES = ['linear', 'monotone', 'natural'] as const;
const LAYOUTS = ['horizontal', 'vertical'] as const;
const TOOLTIP_INDICATORS = ['dot', 'line', 'dashed'] as const;

const DEFAULT_PROPS = {
  title: 'Chart card',
  description: 'Values across the last 6 months',
  primaryLabel: 'Series A',
  secondaryLabel: 'Series B',
  badge: '+12.5%',
  height: 260,
  categoryKey: 'month',
  className: '',
  dataCsv: 'Jan,186,80; Feb,305,200; Mar,237,120; Apr,73,190; May,209,130; Jun,214,140',
  footerDescription: 'Both series move in the same direction.',
  footerTitle: 'Trend summary',
  hideIndicator: false,
  hideLabel: false,
  primaryColor: 'var(--chart-1)',
  primaryKey: 'seriesA',
  secondaryColor: 'var(--chart-2)',
  secondaryKey: 'seriesB',
  seriesCsv: 'seriesA,Series A; seriesB,Series B',
  showGrid: true,
  showLegend: true,
  showSecondary: true,
  showTooltip: true,
  stacked: false,
  tooltipIndicator: 'dot',
} as const;

const COMPOSED_DATA_CSV = 'Jan,186,80,34; Feb,305,200,42; Mar,237,120,38; Apr,73,190,24; May,209,130,36; Jun,214,140,40';
const COMPOSED_SERIES_CSV = 'seriesA,Series A; seriesB,Series B; seriesC,Series C,var(--chart-3)';
const PIE_DATA_CSV = 'Segment A,275,var(--chart-1); Segment B,200,var(--chart-2); Segment C,187,var(--chart-3); Segment D,173,var(--chart-4); Segment E,90,var(--chart-5)';
const RADIAL_DATA_CSV = 'Progress,72';
const SCATTER_DATA_CSV = 'groupA,36,72,120; groupA,52,88,170; groupA,68,95,210; groupB,42,58,110; groupB,59,71,150; groupB,74,83,190';
const SCATTER_SERIES_CSV = 'groupA,Group A; groupB,Group B';

const commonArgTypes = {
  badge: { control: 'text' },
  className: { control: 'text' },
  dataCsv: { control: 'textarea', name: 'Data rows' },
  description: { control: 'text' },
  footerDescription: { control: 'text' },
  footerTitle: { control: 'text' },
  height: { control: { type: 'number', min: 160, max: 520, step: 20 } },
  hideIndicator: { control: 'boolean' },
  hideLabel: { control: 'boolean' },
  showTooltip: { control: 'boolean' },
  title: { control: 'text' },
  tooltipIndicator: { control: 'select', options: TOOLTIP_INDICATORS },
} as const;

const cartesianArgTypes = {
  ...commonArgTypes,
  categoryKey: { control: 'text' },
  primaryColor: { control: 'text' },
  secondaryColor: { control: 'text' },
  seriesCsv: { control: 'textarea', name: 'Series rows' },
  showGrid: { control: 'boolean' },
  showLegend: { control: 'boolean' },
  showSecondary: { control: 'boolean' },
} as const;

const areaChartArgTypes = {
  ...cartesianArgTypes,
  curveType: { control: 'select', options: CURVE_TYPES },
  stacked: { control: 'boolean' },
} as const;

const barChartArgTypes = {
  ...cartesianArgTypes,
  barRadius: { control: { type: 'number', min: 0, max: 16, step: 1 } },
  layout: { control: 'select', options: LAYOUTS },
  stacked: { control: 'boolean' },
} as const;

const composedChartArgTypes = {
  ...cartesianArgTypes,
  barRadius: { control: { type: 'number', min: 0, max: 16, step: 1 } },
  curveType: { control: 'select', options: CURVE_TYPES },
  showArea: { control: 'boolean' },
  showBars: { control: 'boolean' },
  showDots: { control: 'boolean' },
  showLine: { control: 'boolean' },
  stacked: { control: 'boolean' },
} as const;

const lineChartArgTypes = {
  ...cartesianArgTypes,
  curveType: { control: 'select', options: CURVE_TYPES },
  showDots: { control: 'boolean' },
} as const;

const radarChartArgTypes = {
  ...cartesianArgTypes,
  outerRadius: { control: 'text' },
  showRadiusAxis: { control: 'boolean' },
} as const;

const pieChartArgTypes = {
  ...commonArgTypes,
  innerRadius: { control: { type: 'number', min: 0, max: 120, step: 4 } },
  nameKey: { control: 'text' },
  outerRadius: { control: { type: 'number', min: 20, max: 160, step: 4 } },
  paddingAngle: { control: { type: 'number', min: 0, max: 12, step: 1 } },
  showLegend: { control: 'boolean' },
  strokeWidth: { control: { type: 'number', min: 0, max: 12, step: 1 } },
  valueKey: { control: 'text' },
} as const;

const radialChartArgTypes = {
  badge: { control: 'text' },
  className: { control: 'text' },
  cornerRadius: { control: { type: 'number', min: 0, max: 24, step: 1 } },
  dataCsv: { control: 'textarea', name: 'Data rows' },
  description: { control: 'text' },
  endAngle: { control: { type: 'number', min: -360, max: 360, step: 15 } },
  footerDescription: { control: 'text' },
  footerTitle: { control: 'text' },
  height: { control: { type: 'number', min: 160, max: 520, step: 20 } },
  innerRadius: { control: 'text' },
  nameKey: { control: 'text' },
  outerRadius: { control: 'text' },
  primaryColor: { control: 'text' },
  primaryLabel: { control: 'text' },
  showGrid: { control: 'boolean' },
  showTooltip: { control: 'boolean' },
  startAngle: { control: { type: 'number', min: -360, max: 360, step: 15 } },
  title: { control: 'text' },
  valueKey: { control: 'text' },
} as const;

const scatterChartArgTypes = {
  ...commonArgTypes,
  nameKey: { control: 'text' },
  primaryColor: { control: 'text' },
  primaryLabel: { control: 'text' },
  secondaryColor: { control: 'text' },
  secondaryLabel: { control: 'text' },
  seriesCsv: { control: 'textarea', name: 'Series rows' },
  seriesKey: { control: 'text' },
  showGrid: { control: 'boolean' },
  showLegend: { control: 'boolean' },
  xKey: { control: 'text' },
  yKey: { control: 'text' },
  zKey: { control: 'text' },
} as const;

const meta = {
  title: 'shadcn/Base UI/Chart Patterns',
  component: ShadcnAreaChartCard,
  authoring: {
    group: 'Data',
  },
  args: DEFAULT_PROPS,
  argTypes: areaChartArgTypes,
};
export default meta;

export const AreaChartCard = {
  name: 'AreaChartCard',
  args: {
    ...DEFAULT_PROPS,
    curveType: 'natural',
    showLegend: false,
    stacked: true,
    title: 'Area chart',
    tooltipIndicator: 'line',
  },
  argTypes: areaChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Area chart',
      description: 'Values across the last 6 months',
      badge: '+12.5%',
      height: 260,
      categoryKey: 'month',
      className: '',
      dataCsv: DEFAULT_PROPS.dataCsv,
      footerDescription: 'Both series move in the same direction.',
      footerTitle: 'Trend summary',
      hideIndicator: false,
      hideLabel: false,
      primaryColor: 'var(--chart-1)',
      secondaryColor: 'var(--chart-2)',
      seriesCsv: DEFAULT_PROPS.seriesCsv,
      showGrid: true,
      showLegend: false,
      showSecondary: true,
      showTooltip: true,
      stacked: true,
      tooltipIndicator: 'line',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnAreaChartCard
        {...resolveCartesianArgs(args)}
        curveType={asOption(args.curveType, CURVE_TYPES, 'natural')}
        stacked={asBoolean(args.stacked, true)}
        title={asText(args.title, 'Area chart')}
        tooltipIndicator={asOption(args.tooltipIndicator, TOOLTIP_INDICATORS, 'line')}
      />
    </ChartPreviewFrame>
  ),
};

export const BarChartCard = {
  name: 'BarChartCard',
  args: {
    ...DEFAULT_PROPS,
    barRadius: 4,
    layout: 'horizontal',
    title: 'Bar chart',
  },
  argTypes: barChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Bar chart',
      description: 'Series comparison across the last 6 months',
      badge: '+8.4%',
      layout: 'horizontal',
      height: 260,
      barRadius: 4,
      categoryKey: 'month',
      className: '',
      dataCsv: DEFAULT_PROPS.dataCsv,
      footerDescription: 'Series A remains ahead, with Series B closing in.',
      footerTitle: 'Series comparison',
      hideIndicator: false,
      hideLabel: false,
      primaryColor: 'var(--chart-1)',
      secondaryColor: 'var(--chart-2)',
      seriesCsv: DEFAULT_PROPS.seriesCsv,
      showGrid: true,
      showLegend: true,
      showSecondary: true,
      showTooltip: true,
      stacked: false,
      tooltipIndicator: 'dot',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnBarChartCard
        {...resolveCartesianArgs(args)}
        barRadius={asNumber(args.barRadius, 4, { min: 0, max: 16 })}
        layout={asOption(args.layout, LAYOUTS, 'horizontal')}
        stacked={asBoolean(args.stacked, false)}
        title={asText(args.title, 'Bar chart')}
      />
    </ChartPreviewFrame>
  ),
};

export const ComposedChartCard = {
  name: 'ComposedChartCard',
  args: {
    ...DEFAULT_PROPS,
    barRadius: 4,
    curveType: 'monotone',
    dataCsv: COMPOSED_DATA_CSV,
    seriesCsv: COMPOSED_SERIES_CSV,
    showArea: true,
    showBars: true,
    showDots: true,
    showLine: true,
    title: 'Composed chart',
  },
  argTypes: composedChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Composed chart',
      description: 'Mixed bars, line, and area in one view',
      badge: '+18.2%',
      height: 260,
      barRadius: 4,
      categoryKey: 'month',
      className: '',
      curveType: 'monotone',
      dataCsv: COMPOSED_DATA_CSV,
      footerDescription: 'Use one card when multiple series need to be compared together.',
      footerTitle: 'Combined chart summary',
      hideIndicator: false,
      hideLabel: false,
      primaryColor: 'var(--chart-1)',
      secondaryColor: 'var(--chart-2)',
      seriesCsv: COMPOSED_SERIES_CSV,
      showArea: true,
      showBars: true,
      showDots: true,
      showGrid: true,
      showLegend: true,
      showLine: true,
      showSecondary: true,
      showTooltip: true,
      stacked: false,
      tooltipIndicator: 'dot',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnComposedChartCard
        {...resolveCartesianArgs(args)}
        barRadius={asNumber(args.barRadius, 4, { min: 0, max: 16 })}
        curveType={asOption(args.curveType, CURVE_TYPES, 'monotone')}
        showArea={asBoolean(args.showArea, true)}
        showBars={asBoolean(args.showBars, true)}
        showDots={asBoolean(args.showDots, true)}
        showLine={asBoolean(args.showLine, true)}
        stacked={asBoolean(args.stacked, false)}
        title={asText(args.title, 'Composed chart')}
      />
    </ChartPreviewFrame>
  ),
};

export const LineChartCard = {
  name: 'LineChartCard',
  args: {
    ...DEFAULT_PROPS,
    curveType: 'monotone',
    showDots: true,
    title: 'Line chart',
    tooltipIndicator: 'line',
  },
  argTypes: lineChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Line chart',
      description: 'Trend comparison across the last 6 months',
      badge: '+5.2%',
      height: 260,
      categoryKey: 'month',
      className: '',
      curveType: 'monotone',
      dataCsv: DEFAULT_PROPS.dataCsv,
      footerDescription: 'The line stays smooth while still exposing each category.',
      footerTitle: 'Line chart summary',
      hideIndicator: false,
      hideLabel: false,
      primaryColor: 'var(--chart-1)',
      secondaryColor: 'var(--chart-2)',
      seriesCsv: DEFAULT_PROPS.seriesCsv,
      showDots: true,
      showGrid: true,
      showLegend: true,
      showSecondary: true,
      showTooltip: true,
      tooltipIndicator: 'line',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnLineChartCard
        {...resolveCartesianArgs(args)}
        curveType={asOption(args.curveType, CURVE_TYPES, 'monotone')}
        showDots={asBoolean(args.showDots, true)}
        title={asText(args.title, 'Line chart')}
        tooltipIndicator={asOption(args.tooltipIndicator, TOOLTIP_INDICATORS, 'line')}
      />
    </ChartPreviewFrame>
  ),
};

export const RadarChartCard = {
  name: 'RadarChartCard',
  args: {
    ...DEFAULT_PROPS,
    badge: '6 axes',
    height: 300,
    outerRadius: '76%',
    showRadiusAxis: false,
    title: 'Radar chart',
  },
  argTypes: radarChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Radar chart',
      description: 'Compare multiple dimensions around one center',
      badge: '6 axes',
      height: 300,
      categoryKey: 'month',
      className: '',
      dataCsv: DEFAULT_PROPS.dataCsv,
      footerDescription: 'Useful for profile comparisons across the same categories.',
      footerTitle: 'Profile comparison',
      hideIndicator: false,
      hideLabel: false,
      outerRadius: '76%',
      primaryColor: 'var(--chart-1)',
      secondaryColor: 'var(--chart-2)',
      seriesCsv: DEFAULT_PROPS.seriesCsv,
      showGrid: true,
      showLegend: true,
      showRadiusAxis: false,
      showSecondary: true,
      showTooltip: true,
      tooltipIndicator: 'dot',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnRadarChartCard
        {...resolveCartesianArgs(args)}
        height={asNumber(args.height, 300, { min: 160, max: 520 })}
        outerRadius={asText(args.outerRadius, '76%')}
        showRadiusAxis={asBoolean(args.showRadiusAxis, false)}
        title={asText(args.title, 'Radar chart')}
      />
    </ChartPreviewFrame>
  ),
};

export const PieChartCard = {
  name: 'PieChartCard',
  args: {
    ...DEFAULT_PROPS,
    badge: '5 segments',
    dataCsv: PIE_DATA_CSV,
    innerRadius: 58,
    outerRadius: 92,
    paddingAngle: 0,
    strokeWidth: 4,
    title: 'Pie chart',
  },
  argTypes: pieChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Pie chart',
      description: 'Segment share by value',
      badge: '5 segments',
      strokeWidth: 4,
      height: 260,
      className: '',
      dataCsv: PIE_DATA_CSV,
      footerDescription: 'Useful for channel, segment, or category breakdowns.',
      footerTitle: 'Largest segment highlighted',
      hideIndicator: false,
      hideLabel: false,
      innerRadius: 58,
      nameKey: 'segment',
      outerRadius: 92,
      paddingAngle: 0,
      showLegend: true,
      showTooltip: true,
      tooltipIndicator: 'dot',
      valueKey: 'value',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnPieChartCard
        badge={asText(args.badge, '5 segments')}
        className={asText(args.className, DEFAULT_PROPS.className) || undefined}
        dataCsv={asText(args.dataCsv, PIE_DATA_CSV)}
        description={asText(args.description, 'Segment share by value')}
        footerDescription={asText(args.footerDescription, 'Useful for channel, segment, or category breakdowns.')}
        footerTitle={asText(args.footerTitle, 'Largest segment highlighted')}
        height={asNumber(args.height, DEFAULT_PROPS.height, { min: 160, max: 520 })}
        hideIndicator={asBoolean(args.hideIndicator, DEFAULT_PROPS.hideIndicator)}
        hideLabel={asBoolean(args.hideLabel, DEFAULT_PROPS.hideLabel)}
        innerRadius={asNumber(args.innerRadius, 58, { min: 0, max: 120 })}
        nameKey={asText(args.nameKey, 'segment')}
        outerRadius={asNumber(args.outerRadius, 92, { min: 20, max: 160 })}
        paddingAngle={asNumber(args.paddingAngle, 0, { min: 0, max: 12 })}
        showLegend={asBoolean(args.showLegend, DEFAULT_PROPS.showLegend)}
        showTooltip={asBoolean(args.showTooltip, DEFAULT_PROPS.showTooltip)}
        strokeWidth={asNumber(args.strokeWidth, 4, { min: 0, max: 12 })}
        title={asText(args.title, 'Pie chart')}
        tooltipIndicator={asOption(args.tooltipIndicator, TOOLTIP_INDICATORS, DEFAULT_PROPS.tooltipIndicator)}
        valueKey={asText(args.valueKey, 'value')}
      />
    </ChartPreviewFrame>
  ),
};

export const RadialChartCard = {
  name: 'RadialChartCard',
  args: {
    ...DEFAULT_PROPS,
    badge: '72%',
    cornerRadius: 10,
    dataCsv: RADIAL_DATA_CSV,
    innerRadius: '58%',
    outerRadius: '88%',
    title: 'Radial chart',
  },
  argTypes: radialChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Radial chart',
      description: 'Goal completion for the current cycle',
      primaryLabel: 'Progress',
      badge: '72%',
      height: 260,
      className: '',
      cornerRadius: 10,
      dataCsv: RADIAL_DATA_CSV,
      endAngle: -270,
      footerDescription: 'Great for compact KPI, quota, and capacity cards.',
      footerTitle: 'On track this period',
      innerRadius: '58%',
      nameKey: 'name',
      outerRadius: '88%',
      primaryColor: 'var(--chart-1)',
      showGrid: true,
      showTooltip: true,
      startAngle: 90,
      valueKey: 'value',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnRadialChartCard
        badge={asText(args.badge, '72%')}
        className={asText(args.className, DEFAULT_PROPS.className) || undefined}
        color={asText(args.primaryColor, DEFAULT_PROPS.primaryColor)}
        cornerRadius={asNumber(args.cornerRadius, 10, { min: 0, max: 24 })}
        dataCsv={asText(args.dataCsv, RADIAL_DATA_CSV)}
        description={asText(args.description, 'Goal completion for the current cycle')}
        endAngle={asNumber(args.endAngle, -270, { min: -360, max: 360 })}
        footerDescription={asText(args.footerDescription, 'Great for compact KPI, quota, and capacity cards.')}
        footerTitle={asText(args.footerTitle, 'On track this period')}
        height={asNumber(args.height, DEFAULT_PROPS.height, { min: 160, max: 520 })}
        innerRadius={asText(args.innerRadius, '58%')}
        label={asText(args.primaryLabel, 'Progress')}
        nameKey={asText(args.nameKey, 'name')}
        outerRadius={asText(args.outerRadius, '88%')}
        showGrid={asBoolean(args.showGrid, DEFAULT_PROPS.showGrid)}
        showTooltip={asBoolean(args.showTooltip, DEFAULT_PROPS.showTooltip)}
        startAngle={asNumber(args.startAngle, 90, { min: -360, max: 360 })}
        title={asText(args.title, 'Radial chart')}
        valueKey={asText(args.valueKey, 'value')}
      />
    </ChartPreviewFrame>
  ),
};

export const ScatterChartCard = {
  name: 'ScatterChartCard',
  args: {
    ...DEFAULT_PROPS,
    badge: '2 groups',
    dataCsv: SCATTER_DATA_CSV,
    description: 'Plot two numeric dimensions with grouped samples',
    footerDescription: 'Use for cohort, segment, or opportunity maps.',
    footerTitle: 'Clusters are visible',
    height: 280,
    primaryLabel: 'Group A',
    secondaryLabel: 'Group B',
    seriesCsv: SCATTER_SERIES_CSV,
    title: 'Scatter chart',
  },
  argTypes: scatterChartArgTypes,
  sourceInsert: {
    props: {
      title: 'Scatter chart',
      description: 'Plot two numeric dimensions with grouped samples',
      primaryLabel: 'Group A',
      secondaryLabel: 'Group B',
      badge: '2 groups',
      height: 280,
      className: '',
      dataCsv: SCATTER_DATA_CSV,
      footerDescription: 'Use for cohort, segment, or opportunity maps.',
      footerTitle: 'Clusters are visible',
      hideIndicator: false,
      hideLabel: false,
      nameKey: 'name',
      primaryColor: 'var(--chart-1)',
      secondaryColor: 'var(--chart-2)',
      seriesCsv: SCATTER_SERIES_CSV,
      seriesKey: 'series',
      showGrid: true,
      showLegend: true,
      showTooltip: true,
      tooltipIndicator: 'dot',
      xKey: 'x',
      yKey: 'y',
      zKey: 'z',
    },
  },
  render: (args: Args) => (
    <ChartPreviewFrame>
      <ShadcnScatterChartCard
        badge={asText(args.badge, '2 groups')}
        className={asText(args.className, DEFAULT_PROPS.className) || undefined}
        dataCsv={asText(args.dataCsv, SCATTER_DATA_CSV)}
        description={asText(args.description, 'Plot two numeric dimensions with grouped samples')}
        footerDescription={asText(args.footerDescription, 'Use for cohort, segment, or opportunity maps.')}
        footerTitle={asText(args.footerTitle, 'Clusters are visible')}
        height={asNumber(args.height, 280, { min: 160, max: 520 })}
        hideIndicator={asBoolean(args.hideIndicator, DEFAULT_PROPS.hideIndicator)}
        hideLabel={asBoolean(args.hideLabel, DEFAULT_PROPS.hideLabel)}
        nameKey={asText(args.nameKey, 'name')}
        primaryColor={asText(args.primaryColor, DEFAULT_PROPS.primaryColor)}
        primaryLabel={asText(args.primaryLabel, 'Group A')}
        secondaryColor={asText(args.secondaryColor, DEFAULT_PROPS.secondaryColor)}
        secondaryLabel={asText(args.secondaryLabel, 'Group B')}
        seriesCsv={asText(args.seriesCsv, SCATTER_SERIES_CSV)}
        seriesKey={asText(args.seriesKey, 'series')}
        showGrid={asBoolean(args.showGrid, DEFAULT_PROPS.showGrid)}
        showLegend={asBoolean(args.showLegend, DEFAULT_PROPS.showLegend)}
        showTooltip={asBoolean(args.showTooltip, DEFAULT_PROPS.showTooltip)}
        title={asText(args.title, 'Scatter chart')}
        tooltipIndicator={asOption(args.tooltipIndicator, TOOLTIP_INDICATORS, DEFAULT_PROPS.tooltipIndicator)}
        xKey={asText(args.xKey, 'x')}
        yKey={asText(args.yKey, 'y')}
        zKey={asText(args.zKey, 'z')}
      />
    </ChartPreviewFrame>
  ),
};

function ChartPreviewFrame({ children }: { children: React.ReactNode }) {
  return <div className="w-[min(42rem,100%)]">{children}</div>;
}

function resolveCartesianArgs(args: Args) {
  return {
    badge: asText(args.badge, DEFAULT_PROPS.badge),
    categoryKey: asText(args.categoryKey, DEFAULT_PROPS.categoryKey),
    className: asText(args.className, DEFAULT_PROPS.className) || undefined,
    dataCsv: asText(args.dataCsv, DEFAULT_PROPS.dataCsv),
    description: asText(args.description, DEFAULT_PROPS.description),
    footerDescription: asText(args.footerDescription, DEFAULT_PROPS.footerDescription),
    footerTitle: asText(args.footerTitle, DEFAULT_PROPS.footerTitle),
    height: asNumber(args.height, DEFAULT_PROPS.height, { min: 160, max: 520 }),
    hideIndicator: asBoolean(args.hideIndicator, DEFAULT_PROPS.hideIndicator),
    hideLabel: asBoolean(args.hideLabel, DEFAULT_PROPS.hideLabel),
    primaryColor: asText(args.primaryColor, DEFAULT_PROPS.primaryColor),
    primaryKey: asText(args.primaryKey, DEFAULT_PROPS.primaryKey),
    primaryLabel: asText(args.primaryLabel, DEFAULT_PROPS.primaryLabel),
    secondaryColor: asText(args.secondaryColor, DEFAULT_PROPS.secondaryColor),
    secondaryKey: asText(args.secondaryKey, DEFAULT_PROPS.secondaryKey),
    secondaryLabel: asText(args.secondaryLabel, DEFAULT_PROPS.secondaryLabel),
    seriesCsv: asText(args.seriesCsv, DEFAULT_PROPS.seriesCsv),
    showGrid: asBoolean(args.showGrid, DEFAULT_PROPS.showGrid),
    showLegend: asBoolean(args.showLegend, DEFAULT_PROPS.showLegend),
    showSecondary: asBoolean(args.showSecondary, DEFAULT_PROPS.showSecondary),
    showTooltip: asBoolean(args.showTooltip, DEFAULT_PROPS.showTooltip),
    tooltipIndicator: asOption(args.tooltipIndicator, TOOLTIP_INDICATORS, DEFAULT_PROPS.tooltipIndicator),
  };
}
