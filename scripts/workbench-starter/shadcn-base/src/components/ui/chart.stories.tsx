import type * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartContainer as ShadcnChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';
import { asBoolean, asOption } from './story-utils';

type Args = {
  cursor?: boolean | string;
  hideIcon?: boolean | string;
  hideIndicator?: boolean | string;
  hideLabel?: boolean | string;
  indicator?: boolean | string;
  verticalAlign?: boolean | string;
};

const INDICATORS = ['dot', 'line', 'dashed'] as const;
const VERTICAL_ALIGNS = ['top', 'bottom'] as const;

const chartConfig = {
  seriesA: {
    label: 'Series A',
    color: 'var(--chart-1)',
  },
  seriesB: {
    label: 'Series B',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const chartData = [
  { date: 'Apr 3', seriesA: 88, seriesB: 42 },
  { date: 'Apr 9', seriesA: 156, seriesB: 78 },
  { date: 'Apr 15', seriesA: 116, seriesB: 58 },
  { date: 'Apr 21', seriesA: 198, seriesB: 95 },
  { date: 'Apr 27', seriesA: 122, seriesB: 64 },
  { date: 'May 3', seriesA: 212, seriesB: 104 },
  { date: 'May 9', seriesA: 146, seriesB: 73 },
  { date: 'May 15', seriesA: 236, seriesB: 132 },
  { date: 'May 22', seriesA: 128, seriesB: 62 },
  { date: 'May 29', seriesA: 208, seriesB: 109 },
  { date: 'Jun 4', seriesA: 152, seriesB: 80 },
  { date: 'Jun 10', seriesA: 226, seriesB: 118 },
  { date: 'Jun 16', seriesA: 178, seriesB: 89 },
  { date: 'Jun 22', seriesA: 240, seriesB: 136 },
  { date: 'Jun 30', seriesA: 184, seriesB: 96 },
];

const meta = {
  title: 'shadcn/Base UI/Chart',
  component: ShadcnChartContainer,
  authoring: {
    group: 'Data',
  },
  sourceInsert: {
    imports: [
      {
        importSource: 'recharts',
        names: ['AreaChart'],
      },
    ],
    jsxChildren: '<AreaChart data={[]} />',
    props: {
      className: 'aspect-auto h-[250px] w-full',
    },
  },
};
export default meta;

export const ChartContainer = {
  name: 'ChartContainer',
  render: () => (
    <div className="w-[min(42rem,100%)] rounded-xl border bg-card p-4 shadow-xs">
      <div className="mb-4">
        <h3 className="text-base font-medium">Chart title</h3>
        <p className="text-sm text-muted-foreground">Chart description</p>
      </div>
      <ShadcnChartContainer
        className="aspect-auto h-[250px] w-full"
        config={chartConfig}
        initialDimension={{ width: 640, height: 250 }}
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12, top: 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="date"
            interval={0}
            tickLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" />}
            cursor={false}
          />
          <Area
            dataKey="seriesA"
            fill="var(--color-seriesA)"
            fillOpacity={0.28}
            stackId="a"
            stroke="var(--color-seriesA)"
            strokeWidth={2}
            type="natural"
          />
          <Area
            dataKey="seriesB"
            fill="var(--color-seriesB)"
            fillOpacity={0.18}
            stackId="a"
            stroke="var(--color-seriesB)"
            strokeWidth={1.5}
            type="natural"
          />
        </AreaChart>
      </ShadcnChartContainer>
    </div>
  ),
};

export const ChartTooltipStory = {
  name: 'ChartTooltip',
  args: {
    cursor: false,
    indicator: 'line',
  },
  argTypes: {
    cursor: { control: 'boolean' },
    indicator: { control: 'select', options: INDICATORS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ChartTooltipContent'],
        sourceFile: 'src/components/ui/chart.tsx',
      },
    ],
    jsxProps: {
      content: '<ChartTooltipContent indicator="line" />',
    },
    props: {
      cursor: false,
    },
  },
  render: (args: Args) => (
    <ChartStoryFrame>
      <ChartTooltip
        content={<ChartTooltipContent indicator={asOption(args.indicator, INDICATORS, 'line')} />}
        cursor={asBoolean(args.cursor, false)}
      />
    </ChartStoryFrame>
  ),
};

export const ChartTooltipContentStory = {
  name: 'ChartTooltipContent',
  args: {
    hideIndicator: false,
    hideLabel: false,
    indicator: 'line',
  },
  argTypes: {
    hideIndicator: { control: 'boolean' },
    hideLabel: { control: 'boolean' },
    indicator: { control: 'select', options: INDICATORS },
  },
  sourceInsert: {
    props: {
      hideIndicator: false,
      hideLabel: false,
      indicator: 'line',
    },
  },
  render: (args: Args) => (
    <ShadcnChartContainer
      className="h-[140px] w-64"
      config={chartConfig}
      initialDimension={{ width: 256, height: 140 }}
    >
      <ChartTooltipContent
        active
        hideIndicator={asBoolean(args.hideIndicator)}
        hideLabel={asBoolean(args.hideLabel)}
        indicator={asOption(args.indicator, INDICATORS, 'line')}
        label="seriesA"
        payload={[
          {
            color: 'var(--chart-1)',
            dataKey: 'seriesA',
            graphicalItemId: 'seriesA',
            name: 'seriesA',
            payload: { seriesA: 240, seriesB: 136 },
            value: 240,
          },
        ]}
      />
    </ShadcnChartContainer>
  ),
};

export const ChartLegendStory = {
  name: 'ChartLegend',
  args: {
    verticalAlign: 'bottom',
  },
  argTypes: {
    verticalAlign: { control: 'select', options: VERTICAL_ALIGNS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ChartLegendContent'],
        sourceFile: 'src/components/ui/chart.tsx',
      },
    ],
    jsxProps: {
      content: '<ChartLegendContent />',
    },
    props: {
      verticalAlign: 'bottom',
    },
  },
  render: (args: Args) => (
    <ChartStoryFrame>
      <ChartLegend
        content={<ChartLegendContent />}
        verticalAlign={asOption(args.verticalAlign, VERTICAL_ALIGNS, 'bottom')}
      />
    </ChartStoryFrame>
  ),
};

export const ChartLegendContentStory = {
  name: 'ChartLegendContent',
  args: {
    hideIcon: false,
    verticalAlign: 'bottom',
  },
  argTypes: {
    hideIcon: { control: 'boolean' },
    verticalAlign: { control: 'select', options: VERTICAL_ALIGNS },
  },
  sourceInsert: {
    props: {
      hideIcon: false,
      verticalAlign: 'bottom',
    },
  },
  render: (args: Args) => (
    <ShadcnChartContainer
      className="h-16 w-64"
      config={chartConfig}
      initialDimension={{ width: 256, height: 64 }}
    >
      <ChartLegendContent
        hideIcon={asBoolean(args.hideIcon)}
        payload={[
          { color: 'var(--chart-1)', dataKey: 'seriesA', type: 'square', value: 'Series A' },
          { color: 'var(--chart-2)', dataKey: 'seriesB', type: 'square', value: 'Series B' },
        ]}
        verticalAlign={asOption(args.verticalAlign, VERTICAL_ALIGNS, 'bottom')}
      />
    </ShadcnChartContainer>
  ),
};

function ChartStoryFrame({ children }: { children: React.ReactNode }) {
  return (
    <ShadcnChartContainer
      className="aspect-auto h-[180px] w-72"
      config={chartConfig}
      initialDimension={{ width: 288, height: 180 }}
    >
      <AreaChart data={chartData}>
        <XAxis dataKey="date" hide />
        <Area dataKey="seriesA" fill="var(--color-seriesA)" stroke="var(--color-seriesA)" />
        {children}
      </AreaChart>
    </ShadcnChartContainer>
  );
}
