"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Radar,
  RadarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type ChartDatum = Record<string, number | string>

type CartesianSeries = {
  color: string
  key: string
  label: string
}

type ChartCardRootProps = React.ComponentProps<"div">

type CartesianChartProps = ChartCardRootProps & {
  badge?: string
  categoryKey?: string
  data?: ChartDatum[]
  dataCsv?: string
  description?: string
  footerDescription?: string
  footerTitle?: string
  height?: number
  hideIndicator?: boolean
  hideLabel?: boolean
  primaryColor?: string
  primaryKey?: string
  primaryLabel?: string
  secondaryColor?: string
  secondaryKey?: string
  secondaryLabel?: string
  showGrid?: boolean
  showLegend?: boolean
  showSecondary?: boolean
  showTooltip?: boolean
  seriesCsv?: string
  title?: string
  tooltipIndicator?: "dot" | "line" | "dashed"
}

type AreaChartCardProps = CartesianChartProps & {
  curveType?: "linear" | "monotone" | "natural"
  stacked?: boolean
}

type BarChartCardProps = CartesianChartProps & {
  barRadius?: number
  layout?: "horizontal" | "vertical"
  stacked?: boolean
}

type ComposedChartCardProps = CartesianChartProps & {
  barRadius?: number
  curveType?: "linear" | "monotone" | "natural"
  showArea?: boolean
  showBars?: boolean
  showDots?: boolean
  showLine?: boolean
  stacked?: boolean
}

type LineChartCardProps = CartesianChartProps & {
  curveType?: "linear" | "monotone" | "natural"
  showDots?: boolean
}

type RadarChartCardProps = CartesianChartProps & {
  outerRadius?: number | string
  showRadiusAxis?: boolean
}

type PieChartCardProps = ChartCardRootProps & {
  badge?: string
  data?: PieChartDatum[]
  dataCsv?: string
  description?: string
  footerDescription?: string
  footerTitle?: string
  height?: number
  hideIndicator?: boolean
  hideLabel?: boolean
  innerRadius?: number
  nameKey?: string
  outerRadius?: number
  paddingAngle?: number
  seriesCsv?: string
  showLegend?: boolean
  showTooltip?: boolean
  strokeWidth?: number
  title?: string
  tooltipIndicator?: "dot" | "line" | "dashed"
  valueKey?: string
}

type RadialChartCardProps = ChartCardRootProps & {
  badge?: string
  color?: string
  cornerRadius?: number
  data?: ChartDatum[]
  dataCsv?: string
  description?: string
  endAngle?: number
  footerDescription?: string
  footerTitle?: string
  height?: number
  innerRadius?: string | number
  label?: string
  nameKey?: string
  outerRadius?: string | number
  seriesCsv?: string
  showGrid?: boolean
  showTooltip?: boolean
  startAngle?: number
  title?: string
  valueKey?: string
}

type ScatterChartCardProps = ChartCardRootProps & {
  badge?: string
  data?: ChartDatum[]
  dataCsv?: string
  description?: string
  footerDescription?: string
  footerTitle?: string
  height?: number
  hideIndicator?: boolean
  hideLabel?: boolean
  nameKey?: string
  primaryColor?: string
  primaryLabel?: string
  secondaryColor?: string
  secondaryLabel?: string
  seriesCsv?: string
  seriesKey?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  title?: string
  tooltipIndicator?: "dot" | "line" | "dashed"
  xKey?: string
  yKey?: string
  zKey?: string
}

type PieChartDatum = ChartDatum & {
  fill?: string
}

const defaultCartesianData = [
  { month: "Jan", seriesA: 186, seriesB: 80 },
  { month: "Feb", seriesA: 305, seriesB: 200 },
  { month: "Mar", seriesA: 237, seriesB: 120 },
  { month: "Apr", seriesA: 73, seriesB: 190 },
  { month: "May", seriesA: 209, seriesB: 130 },
  { month: "Jun", seriesA: 214, seriesB: 140 },
]

const defaultCartesianDataCsv = "Jan,186,80; Feb,305,200; Mar,237,120; Apr,73,190; May,209,130; Jun,214,140"

const defaultCartesianSeriesCsv = "seriesA,Series A; seriesB,Series B"

const defaultComposedDataCsv = "Jan,186,80,34; Feb,305,200,42; Mar,237,120,38; Apr,73,190,24; May,209,130,36; Jun,214,140,40"

const defaultComposedSeriesCsv = "seriesA,Series A; seriesB,Series B; seriesC,Series C,var(--chart-3)"

const defaultPieData: PieChartDatum[] = [
  { segment: "Segment A", value: 275, fill: "var(--chart-1)" },
  { segment: "Segment B", value: 200, fill: "var(--chart-2)" },
  { segment: "Segment C", value: 187, fill: "var(--chart-3)" },
  { segment: "Segment D", value: 173, fill: "var(--chart-4)" },
  { segment: "Segment E", value: 90, fill: "var(--chart-5)" },
]

const defaultPieDataCsv = "Segment A,275,var(--chart-1); Segment B,200,var(--chart-2); Segment C,187,var(--chart-3); Segment D,173,var(--chart-4); Segment E,90,var(--chart-5)"

const defaultRadialData = [
  { name: "Progress", value: 72, fill: "var(--color-value)" },
]

const defaultRadialDataCsv = "Progress,72"

const defaultScatterData = [
  { series: "groupA", x: 36, y: 72, z: 120 },
  { series: "groupA", x: 52, y: 88, z: 170 },
  { series: "groupA", x: 68, y: 95, z: 210 },
  { series: "groupB", x: 42, y: 58, z: 110 },
  { series: "groupB", x: 59, y: 71, z: 150 },
  { series: "groupB", x: 74, y: 83, z: 190 },
]

const defaultScatterDataCsv = "groupA,36,72,120; groupA,52,88,170; groupA,68,95,210; groupB,42,58,110; groupB,59,71,150; groupB,74,83,190"

const defaultScatterSeriesCsv = "groupA,Group A; groupB,Group B"

function AreaChartCard({
  badge = "+12.5%",
  categoryKey = "month",
  className,
  curveType = "natural",
  data,
  dataCsv = defaultCartesianDataCsv,
  description = "Values across the last 6 months",
  footerDescription = "Both series move in the same direction.",
  footerTitle = "Trend summary",
  height = 260,
  hideIndicator = false,
  hideLabel = false,
  primaryColor = "var(--chart-1)",
  primaryKey = "seriesA",
  primaryLabel = "Series A",
  secondaryColor = "var(--chart-2)",
  secondaryKey = "seriesB",
  secondaryLabel = "Series B",
  showGrid = true,
  showLegend = false,
  showSecondary = true,
  showTooltip = true,
  seriesCsv = defaultCartesianSeriesCsv,
  stacked = true,
  title = "Area chart",
  tooltipIndicator = "line",
  ...props
}: AreaChartCardProps) {
  const series = resolveCartesianSeries({
    primaryColor,
    primaryKey,
    primaryLabel,
    secondaryColor,
    secondaryKey,
    secondaryLabel,
    seriesCsv,
    showSecondary,
  })
  const chartData = resolveCartesianData({
    categoryKey,
    data,
    dataCsv,
    series,
  })
  const config = createCartesianConfig(series)

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="w-full"
        config={config}
        initialDimension={{ width: 640, height }}
        style={{ height }}
      >
        <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
          {showGrid ? <CartesianGrid vertical={false} /> : null}
          <XAxis
            axisLine={false}
            dataKey={categoryKey}
            tickLine={false}
            tickMargin={8}
          />
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                />
              }
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {series.map((item, index) => (
            <Area
              key={item.key}
              dataKey={item.key}
              fill={`var(--color-${item.key})`}
              fillOpacity={index === 0 ? 0.26 : 0.18}
              stackId={stacked ? "a" : undefined}
              stroke={`var(--color-${item.key})`}
              strokeWidth={index === 0 ? 2 : 1.5}
              type={curveType}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function BarChartCard({
  badge = "+8.4%",
  barRadius = 4,
  categoryKey = "month",
  className,
  data,
  dataCsv = defaultCartesianDataCsv,
  description = "Series comparison across the last 6 months",
  footerDescription = "Series A remains ahead, with Series B closing in.",
  footerTitle = "Series comparison",
  height = 260,
  hideIndicator = false,
  hideLabel = false,
  layout = "horizontal",
  primaryColor = "var(--chart-1)",
  primaryKey = "seriesA",
  primaryLabel = "Series A",
  secondaryColor = "var(--chart-2)",
  secondaryKey = "seriesB",
  secondaryLabel = "Series B",
  showGrid = true,
  showLegend = true,
  showSecondary = true,
  showTooltip = true,
  seriesCsv = defaultCartesianSeriesCsv,
  stacked = false,
  title = "Bar chart",
  tooltipIndicator = "dot",
  ...props
}: BarChartCardProps) {
  const series = resolveCartesianSeries({
    primaryColor,
    primaryKey,
    primaryLabel,
    secondaryColor,
    secondaryKey,
    secondaryLabel,
    seriesCsv,
    showSecondary,
  })
  const chartData = resolveCartesianData({
    categoryKey,
    data,
    dataCsv,
    series,
  })
  const config = createCartesianConfig(series)
  const horizontalBars = layout === "horizontal"
  const rechartsLayout = horizontalBars ? "vertical" : "horizontal"

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="w-full"
        config={config}
        initialDimension={{ width: 640, height }}
        style={{ height }}
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          layout={rechartsLayout}
          margin={{ left: horizontalBars ? 12 : 8, right: 12, top: 8 }}
        >
          {showGrid ? <CartesianGrid horizontal={!horizontalBars} vertical={horizontalBars} /> : null}
          {horizontalBars ? (
            <>
              <XAxis hide type="number" />
              <YAxis
                axisLine={false}
                dataKey={categoryKey}
                tickLine={false}
                tickMargin={8}
                type="category"
              />
            </>
          ) : (
            <>
              <XAxis
                axisLine={false}
                dataKey={categoryKey}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis hide type="number" />
            </>
          )}
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                />
              }
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={`var(--color-${item.key})`}
              radius={barRadius}
              stackId={stacked ? "a" : undefined}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function ComposedChartCard({
  badge = "+18.2%",
  barRadius = 4,
  categoryKey = "month",
  className,
  curveType = "monotone",
  data,
  dataCsv = defaultComposedDataCsv,
  description = "Mixed bars, line, and area in one view",
  footerDescription = "Use one card when multiple series need to be compared together.",
  footerTitle = "Combined chart summary",
  height = 260,
  hideIndicator = false,
  hideLabel = false,
  primaryColor = "var(--chart-1)",
  primaryKey = "seriesA",
  primaryLabel = "Series A",
  secondaryColor = "var(--chart-2)",
  secondaryKey = "seriesB",
  secondaryLabel = "Series B",
  seriesCsv = defaultComposedSeriesCsv,
  showArea = true,
  showBars = true,
  showDots = true,
  showGrid = true,
  showLegend = true,
  showLine = true,
  showSecondary = true,
  showTooltip = true,
  stacked = false,
  title = "Composed chart",
  tooltipIndicator = "dot",
  ...props
}: ComposedChartCardProps) {
  const series = resolveCartesianSeries({
    primaryColor,
    primaryKey,
    primaryLabel,
    secondaryColor,
    secondaryKey,
    secondaryLabel,
    seriesCsv,
    showSecondary,
  })
  const chartData = resolveCartesianData({
    categoryKey,
    data,
    dataCsv,
    series,
  })
  const config = createCartesianConfig(series)
  const barSeries = showBars ? series[0] : undefined
  const lineSeries = showLine ? (series[1] ?? series[0]) : undefined
  const areaSeries = showArea ? (series[2] ?? series[0]) : undefined

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="w-full"
        config={config}
        initialDimension={{ width: 640, height }}
        style={{ height }}
      >
        <ComposedChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
          {showGrid ? <CartesianGrid vertical={false} /> : null}
          <XAxis
            axisLine={false}
            dataKey={categoryKey}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide type="number" />
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                />
              }
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {areaSeries ? (
            <Area
              dataKey={areaSeries.key}
              fill={`var(--color-${areaSeries.key})`}
              fillOpacity={0.16}
              stackId={stacked ? "a" : undefined}
              stroke={`var(--color-${areaSeries.key})`}
              strokeWidth={1.5}
              type={curveType}
            />
          ) : null}
          {barSeries ? (
            <Bar
              dataKey={barSeries.key}
              fill={`var(--color-${barSeries.key})`}
              radius={barRadius}
              stackId={stacked ? "a" : undefined}
            />
          ) : null}
          {lineSeries ? (
            <Line
              dataKey={lineSeries.key}
              dot={showDots}
              stroke={`var(--color-${lineSeries.key})`}
              strokeWidth={2}
              type={curveType}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function LineChartCard({
  badge = "+5.2%",
  categoryKey = "month",
  className,
  curveType = "monotone",
  data,
  dataCsv = defaultCartesianDataCsv,
  description = "Trend comparison across the last 6 months",
  footerDescription = "The line stays smooth while still exposing each category.",
  footerTitle = "Line chart summary",
  height = 260,
  hideIndicator = false,
  hideLabel = false,
  primaryColor = "var(--chart-1)",
  primaryKey = "seriesA",
  primaryLabel = "Series A",
  secondaryColor = "var(--chart-2)",
  secondaryKey = "seriesB",
  secondaryLabel = "Series B",
  showDots = true,
  showGrid = true,
  showLegend = true,
  showSecondary = true,
  showTooltip = true,
  seriesCsv = defaultCartesianSeriesCsv,
  title = "Line chart",
  tooltipIndicator = "line",
  ...props
}: LineChartCardProps) {
  const series = resolveCartesianSeries({
    primaryColor,
    primaryKey,
    primaryLabel,
    secondaryColor,
    secondaryKey,
    secondaryLabel,
    seriesCsv,
    showSecondary,
  })
  const chartData = resolveCartesianData({
    categoryKey,
    data,
    dataCsv,
    series,
  })
  const config = createCartesianConfig(series)

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="w-full"
        config={config}
        initialDimension={{ width: 640, height }}
        style={{ height }}
      >
        <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
          {showGrid ? <CartesianGrid vertical={false} /> : null}
          <XAxis
            axisLine={false}
            dataKey={categoryKey}
            tickLine={false}
            tickMargin={8}
          />
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                />
              }
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {series.map((item) => (
            <Line
              key={item.key}
              dataKey={item.key}
              dot={showDots}
              stroke={`var(--color-${item.key})`}
              strokeWidth={2}
              type={curveType}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function RadarChartCard({
  badge = "6 axes",
  categoryKey = "month",
  className,
  data,
  dataCsv = defaultCartesianDataCsv,
  description = "Compare multiple dimensions around one center",
  footerDescription = "Useful for profile comparisons across the same categories.",
  footerTitle = "Profile comparison",
  height = 300,
  hideIndicator = false,
  hideLabel = false,
  outerRadius = "76%",
  primaryColor = "var(--chart-1)",
  primaryKey = "seriesA",
  primaryLabel = "Series A",
  secondaryColor = "var(--chart-2)",
  secondaryKey = "seriesB",
  secondaryLabel = "Series B",
  seriesCsv = defaultCartesianSeriesCsv,
  showGrid = true,
  showLegend = true,
  showRadiusAxis = false,
  showSecondary = true,
  showTooltip = true,
  title = "Radar chart",
  tooltipIndicator = "dot",
  ...props
}: RadarChartCardProps) {
  const series = resolveCartesianSeries({
    primaryColor,
    primaryKey,
    primaryLabel,
    secondaryColor,
    secondaryKey,
    secondaryLabel,
    seriesCsv,
    showSecondary,
  })
  const chartData = resolveCartesianData({
    categoryKey,
    data,
    dataCsv,
    series,
  })
  const config = createCartesianConfig(series)

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="mx-auto w-full"
        config={config}
        initialDimension={{ width: 480, height }}
        style={{ height }}
      >
        <RadarChart accessibilityLayer data={chartData} outerRadius={outerRadius}>
          {showGrid ? <PolarGrid /> : null}
          <PolarAngleAxis dataKey={categoryKey} tickLine={false} />
          {showRadiusAxis ? <PolarRadiusAxis axisLine={false} tickLine={false} /> : null}
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                />
              }
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {series.map((item, index) => (
            <Radar
              key={item.key}
              dataKey={item.key}
              fill={`var(--color-${item.key})`}
              fillOpacity={index === 0 ? 0.22 : 0.12}
              stroke={`var(--color-${item.key})`}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function PieChartCard({
  badge = "5 segments",
  className,
  data,
  dataCsv = defaultPieDataCsv,
  description = "Segment share by value",
  footerDescription = "Useful for channel, segment, or category breakdowns.",
  footerTitle = "Largest segment highlighted",
  height = 260,
  hideIndicator = false,
  hideLabel = false,
  innerRadius = 58,
  nameKey = "segment",
  outerRadius = 92,
  paddingAngle = 0,
  seriesCsv: _seriesCsv,
  showLegend = true,
  showTooltip = true,
  strokeWidth = 4,
  title = "Pie chart",
  tooltipIndicator = "dot",
  valueKey = "value",
  ...props
}: PieChartCardProps) {
  const chartData = resolvePieData(data, dataCsv, nameKey, valueKey)
  const config = createPieConfig(chartData, nameKey)

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="mx-auto w-full"
        config={config}
        initialDimension={{ width: 420, height }}
        style={{ height }}
      >
        <PieChart accessibilityLayer>
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                  nameKey={nameKey}
                />
              }
            />
          ) : null}
          <Pie
            data={chartData}
            dataKey={valueKey}
            innerRadius={innerRadius}
            nameKey={nameKey}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            strokeWidth={strokeWidth}
          >
            {chartData.map((item, index) => (
              <Cell
                key={`${String(item[nameKey])}-${index}`}
                fill={String(item.fill ?? `var(--chart-${(index % 5) + 1})`)}
              />
            ))}
          </Pie>
          {showLegend ? <ChartLegend content={<ChartLegendContent nameKey={nameKey} />} /> : null}
        </PieChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function RadialChartCard({
  badge = "72%",
  className,
  color = "var(--chart-1)",
  cornerRadius = 10,
  data,
  dataCsv = defaultRadialDataCsv,
  description = "Goal completion for the current cycle",
  endAngle = -270,
  footerDescription = "Great for compact KPI, quota, and capacity cards.",
  footerTitle = "On track this period",
  height = 260,
  innerRadius = "58%",
  label = "Progress",
  nameKey = "name",
  outerRadius = "88%",
  seriesCsv: _seriesCsv,
  showGrid = true,
  showTooltip = true,
  startAngle = 90,
  title = "Radial chart",
  valueKey = "value",
  ...props
}: RadialChartCardProps) {
  const config = {
    [valueKey]: {
      label,
      color,
    },
  } satisfies ChartConfig
  const sourceData = resolveRadialData(data, dataCsv, nameKey, valueKey, label, color)
  const radialData = sourceData.map((item) => ({
    ...item,
    name: item[nameKey] ?? label,
    fill: item.fill ?? `var(--color-${valueKey})`,
  }))

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="mx-auto w-full"
        config={config}
        initialDimension={{ width: 420, height }}
        style={{ height }}
      >
        <RadialBarChart
          accessibilityLayer
          data={radialData}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
        >
          {showGrid ? (
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
            />
          ) : null}
          {showTooltip ? (
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          ) : null}
          <RadialBar
            background
            cornerRadius={cornerRadius}
            dataKey={valueKey}
          />
        </RadialBarChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function ScatterChartCard({
  badge = "2 groups",
  className,
  data,
  dataCsv = defaultScatterDataCsv,
  description = "Plot two numeric dimensions with grouped samples",
  footerDescription = "Use for cohort, segment, or opportunity maps.",
  footerTitle = "Clusters are visible",
  height = 280,
  hideIndicator = false,
  hideLabel = false,
  nameKey = "name",
  primaryColor = "var(--chart-1)",
  primaryLabel = "Group A",
  secondaryColor = "var(--chart-2)",
  secondaryLabel = "Group B",
  seriesCsv = defaultScatterSeriesCsv,
  seriesKey = "series",
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  title = "Scatter chart",
  tooltipIndicator = "dot",
  xKey = "x",
  yKey = "y",
  zKey = "z",
  ...props
}: ScatterChartCardProps) {
  const series = resolveCartesianSeries({
    primaryColor,
    primaryKey: "groupA",
    primaryLabel,
    secondaryColor,
    secondaryKey: "groupB",
    secondaryLabel,
    seriesCsv,
    showSecondary: true,
  })
  const chartData = resolveScatterData({
    data,
    dataCsv,
    nameKey,
    series,
    seriesKey,
    xKey,
    yKey,
    zKey,
  })
  const config = createCartesianConfig(series)

  return (
    <ChartCardFrame
      badge={badge}
      className={className}
      description={description}
      footerDescription={footerDescription}
      footerTitle={footerTitle}
      title={title}
      {...props}
    >
      <ChartContainer
        className="w-full"
        config={config}
        initialDimension={{ width: 640, height }}
        style={{ height }}
      >
        <ScatterChart accessibilityLayer margin={{ left: 12, right: 12, top: 8 }}>
          {showGrid ? <CartesianGrid /> : null}
          <XAxis
            axisLine={false}
            dataKey={xKey}
            name={xKey}
            tickLine={false}
            tickMargin={8}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey={yKey}
            name={yKey}
            tickLine={false}
            tickMargin={8}
            type="number"
          />
          <ZAxis dataKey={zKey} range={[60, 220]} />
          {showTooltip ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideIndicator={hideIndicator}
                  hideLabel={hideLabel}
                  indicator={tooltipIndicator}
                />
              }
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {series.map((item) => (
            <Scatter
              key={item.key}
              data={chartData.filter((datum) => datum[seriesKey] === item.key)}
              fill={`var(--color-${item.key})`}
              name={item.label}
            />
          ))}
        </ScatterChart>
      </ChartContainer>
    </ChartCardFrame>
  )
}

function resolveCartesianData({
  categoryKey,
  data,
  dataCsv,
  series,
}: {
  categoryKey: string
  data?: ChartDatum[]
  dataCsv?: string
  series: CartesianSeries[]
}): ChartDatum[] {
  if (data?.length) return data
  const parsed = parseDataRows(dataCsv).flatMap((row): ChartDatum[] => {
    const category = row[0]
    if (!category) return []
    const values = series.reduce<ChartDatum>((entry, item, index) => {
      entry[item.key] = parseNumberCell(row[index + 1]) ?? 0
      return entry
    }, { [categoryKey]: category })
    return [{
      ...values,
    }]
  })
  return parsed.length > 0 ? parsed : defaultCartesianData
}

function resolveCartesianSeries({
  primaryColor,
  primaryKey,
  primaryLabel,
  secondaryColor,
  secondaryKey,
  secondaryLabel,
  seriesCsv,
  showSecondary,
}: {
  primaryColor: string
  primaryKey: string
  primaryLabel: string
  secondaryColor: string
  secondaryKey: string
  secondaryLabel: string
  seriesCsv?: string
  showSecondary: boolean
}): CartesianSeries[] {
  const parsed = parseDataRows(seriesCsv).flatMap((row, index): CartesianSeries[] => {
    const key = row[0]
    if (!key) return []
    return [{
      key,
      label: row[1] || formatSeriesLabel(key),
      color: row[2] || getDefaultSeriesColor(index, primaryColor, secondaryColor),
    }]
  })
  const fallbackSeries = [
    { key: primaryKey, label: primaryLabel, color: primaryColor },
    { key: secondaryKey, label: secondaryLabel, color: secondaryColor },
  ]
  const sourceSeries = parsed.length > 0 ? parsed : fallbackSeries
  const visibleSeries = showSecondary ? sourceSeries : sourceSeries.slice(0, 1)
  const seen = new Set<string>()
  const uniqueSeries = visibleSeries.filter((item) => {
    if (!item.key || seen.has(item.key)) return false
    seen.add(item.key)
    return true
  })
  return uniqueSeries.length > 0
    ? uniqueSeries
    : [{ key: "value", label: "Value", color: primaryColor }]
}

function resolvePieData(
  data: PieChartDatum[] | undefined,
  dataCsv: string | undefined,
  nameKey: string,
  valueKey: string,
): PieChartDatum[] {
  if (data?.length) return data
  const parsed = parseDataRows(dataCsv).flatMap((row, index): PieChartDatum[] => {
    const name = row[0]
    const value = parseNumberCell(row[1])
    if (!name || value === null) return []
    return [{
      [nameKey]: name,
      [valueKey]: value,
      fill: row[2] || `var(--chart-${(index % 5) + 1})`,
    }]
  })
  return parsed.length > 0 ? parsed : defaultPieData
}

function resolveRadialData(
  data: ChartDatum[] | undefined,
  dataCsv: string | undefined,
  nameKey: string,
  valueKey: string,
  label: string,
  color: string,
): ChartDatum[] {
  if (data?.length) return data
  const parsed = parseDataRows(dataCsv).flatMap((row): ChartDatum[] => {
    const value = parseNumberCell(row[1])
    if (value === null) return []
    return [{
      [nameKey]: row[0] || label,
      [valueKey]: value,
      fill: row[2] || color,
    }]
  })
  return parsed.length > 0 ? parsed : defaultRadialData
}

function resolveScatterData({
  data,
  dataCsv,
  nameKey,
  series,
  seriesKey,
  xKey,
  yKey,
  zKey,
}: {
  data?: ChartDatum[]
  dataCsv?: string
  nameKey: string
  series: CartesianSeries[]
  seriesKey: string
  xKey: string
  yKey: string
  zKey: string
}): ChartDatum[] {
  if (data?.length) return data
  const fallbackSeriesKey = series[0]?.key ?? "series"
  const parsed = parseDataRows(dataCsv).flatMap((row, index): ChartDatum[] => {
    const xValue = parseNumberCell(row[1])
    const yValue = parseNumberCell(row[2])
    if (xValue === null || yValue === null) return []
    return [{
      [seriesKey]: row[0] || fallbackSeriesKey,
      [xKey]: xValue,
      [yKey]: yValue,
      [zKey]: parseNumberCell(row[3]) ?? 120,
      [nameKey]: row[4] || `Sample ${index + 1}`,
    }]
  })
  return parsed.length > 0 ? parsed : defaultScatterData
}

function parseDataRows(dataCsv: string | undefined): string[][] {
  if (!dataCsv?.trim()) return []
  return dataCsv
    .split(/\r?\n|;/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split(",").map((cell) => cell.trim()))
}

function parseNumberCell(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const parsed = Number(value.replace(/,/g, "").replace(/%$/, ""))
  return Number.isFinite(parsed) ? parsed : null
}

function ChartCardFrame({
  badge,
  children,
  className,
  description,
  footerDescription,
  footerTitle,
  title,
  ...props
}: ChartCardRootProps & {
  badge?: string
  description?: string
  footerDescription?: string
  footerTitle?: string
  title?: string
}) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {badge ? (
          <CardAction>
            <Badge variant="secondary">{badge}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {(footerTitle || footerDescription) ? (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footerTitle ? <div className="font-medium">{footerTitle}</div> : null}
          {footerDescription ? (
            <div className="text-muted-foreground">{footerDescription}</div>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  )
}

function createCartesianConfig(series: CartesianSeries[]) {
  return series.reduce<ChartConfig>((config, item) => {
    config[item.key] = {
      label: item.label,
      color: item.color,
    }
    return config
  }, {})
}

function formatSeriesLabel(key: string) {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getDefaultSeriesColor(index: number, primaryColor: string, secondaryColor: string) {
  if (index === 0) return primaryColor
  if (index === 1) return secondaryColor
  return `var(--chart-${(index % 5) + 1})`
}

function createPieConfig(data: PieChartDatum[], nameKey: string) {
  return data.reduce<ChartConfig>((config, item, index) => {
    const key = String(item[nameKey] ?? `item-${index}`)
    config[key] = {
      label: key,
      color: String(item.fill ?? `var(--chart-${(index % 5) + 1})`),
    }
    return config
  }, {})
}

export {
  AreaChartCard,
  BarChartCard,
  ComposedChartCard,
  LineChartCard,
  PieChartCard,
  RadialChartCard,
  RadarChartCard,
  ScatterChartCard,
  type AreaChartCardProps,
  type BarChartCardProps,
  type ComposedChartCardProps,
  type ChartDatum,
  type CartesianSeries,
  type LineChartCardProps,
  type PieChartCardProps,
  type PieChartDatum,
  type RadialChartCardProps,
  type RadarChartCardProps,
  type ScatterChartCardProps,
}
