import '../workbench-tokens.css';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { AreaChartCard, BarChartCard } from '../components/ui/chart-patterns';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../components/ui/drawer';
import { Icon } from '../components/ui/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '../components/ui/item';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../components/ui/popover';
import { Progress, ProgressLabel, ProgressValue } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sidebar,
  SidebarBrand,
  SidebarBrandContent,
  SidebarBrandMark,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { Theme } from '../components/ui/theme';

export default function SaasDashboardPage() {
  return (
    <Theme
      as="main"
      mode="auto"
      surface="background"
      theme="blue"
      className="min-h-screen rounded-none bg-muted text-foreground dark:bg-background"
      aria-label="Pulseboard SaaS dashboard"
    >
      <SidebarProvider className="min-h-screen bg-muted dark:bg-background">
        <Sidebar
          className="border-0 [&_[data-slot=sidebar-inner]]:bg-neutral-950 [&_[data-slot=sidebar-inner]]:text-neutral-50"
          collapsedSize="md"
        >
          <SidebarHeader className="px-4 pt-5">
            <SidebarBrand>
              <SidebarBrandMark variant="framed" className="bg-blue-600 p-1 text-white">
                <Icon name="sparkles" size={18} position="none" />
              </SidebarBrandMark>
              <SidebarBrandContent>
                <p className="font-heading text-sm font-semibold text-white">Pulseboard</p>
                <p className="text-xs text-neutral-500">Revenue OS</p>
              </SidebarBrandContent>
            </SidebarBrand>
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-neutral-600">Command center</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive
                      tooltip="Overview"
                      className="bg-blue-600 text-white hover:bg-blue-500 hover:text-white"
                    >
                      <Icon name="layout-dashboard" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue" className="text-neutral-400 hover:bg-white/10 hover:text-white">
                      <Icon name="badge-dollar-sign" />
                      <span>Revenue</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Customers" className="text-neutral-400 hover:bg-white/10 hover:text-white">
                      <Icon name="users-round" />
                      <span>Customers</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Experiments" className="text-neutral-400 hover:bg-white/10 hover:text-white">
                      <Icon name="flask-conical" />
                      <span>Experiments</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-neutral-600">Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Reports" className="text-neutral-400 hover:bg-white/10 hover:text-white">
                      <Icon name="chart-spline" />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Automations" className="text-neutral-400 hover:bg-white/10 hover:text-white">
                      <Icon name="workflow" />
                      <span>Automations</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Team" className="text-neutral-400 hover:bg-white/10 hover:text-white">
                      <Icon name="blocks" />
                      <span>Team</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-4 pb-5">
            <Item className="border-0 bg-white/10 px-3 py-3 text-neutral-50 group-data-[collapsible=icon]:hidden">
              <ItemMedia>
                <Avatar fallback="MK" size="sm" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-white">Maya Kim</ItemTitle>
                <ItemDescription className="text-neutral-500 text-xs">Growth lead · Pro plan</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Icon name="chevrons-up-down" size={14} position="none" />
              </ItemActions>
            </Item>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0 bg-muted dark:bg-background">
          <header className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xl dark:bg-background/90">
            <div className="mx-auto flex min-h-20 w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-5 md:px-6 xl:flex-nowrap xl:gap-4 xl:px-8 xl:py-0">
              <div className="flex min-w-44 flex-1 items-center gap-2 sm:gap-3">
                <SidebarTrigger aria-label="Toggle navigation" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">Acme Inc. / Executive overview</p>
                  <h1 className="truncate font-heading text-lg font-semibold">Friday, August 16</h1>
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                <Popover>
                  <PopoverTrigger
                    className="inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-secondary p-0 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 xl:h-8 xl:w-auto xl:px-2.5"
                    aria-label="View synchronization status"
                    render={<Button variant="secondary" size="sm" />}
                  >
                    <Icon name="circle-check" size={17} position="none" />
                    <span className="hidden xl:inline">Synced 2 min ago</span>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={8} className="w-80 gap-3 p-3">
                    <PopoverHeader>
                      <PopoverTitle>Workspace data is healthy</PopoverTitle>
                      <PopoverDescription>
                        Revenue signals are current across all connected systems.
                      </PopoverDescription>
                    </PopoverHeader>
                    <ItemGroup className="gap-1">
                      <Item className="border-0 bg-muted/60 px-3 py-2.5">
                        <ItemMedia variant="icon" className="size-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Icon name="badge-dollar-sign" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Billing</ItemTitle>
                          <ItemDescription>Stripe · synced 2 min ago</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <span className="size-2 rounded-full bg-emerald-500" aria-label="Healthy" />
                        </ItemActions>
                      </Item>
                      <Item className="border-0 bg-muted/60 px-3 py-2.5">
                        <ItemMedia variant="icon" className="size-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Icon name="users-round" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Customer records</ItemTitle>
                          <ItemDescription>HubSpot · synced 4 min ago</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <span className="size-2 rounded-full bg-emerald-500" aria-label="Healthy" />
                        </ItemActions>
                      </Item>
                      <Item className="border-0 bg-muted/60 px-3 py-2.5">
                        <ItemMedia variant="icon" className="size-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Icon name="chart-spline" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Product analytics</ItemTitle>
                          <ItemDescription>Warehouse · synced 6 min ago</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <span className="size-2 rounded-full bg-emerald-500" aria-label="Healthy" />
                        </ItemActions>
                      </Item>
                    </ItemGroup>
                    <p className="px-1 text-xs text-muted-foreground">Next automatic refresh in 13 minutes.</p>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" aria-label="Search">
                  <Icon name="search" size={17} position="none" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Icon name="bell" size={17} position="none" />
                </Button>
                <Drawer direction="right" dismissible>
                  <DrawerTrigger
                    className="inline-flex size-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary p-0 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 xl:h-9 xl:w-auto xl:px-4"
                    aria-label="Create new report"
                  >
                    <Icon name="plus" size={16} position="none" />
                    <span className="hidden xl:inline">New report</span>
                  </DrawerTrigger>
                  <DrawerContent className="border-border bg-popover">
                    <DrawerHeader className="border-border">
                      <DrawerTitle className="text-lg">Create a report</DrawerTitle>
                      <DrawerDescription>
                        Choose a focused starting point. You can tune sections and recipients in the builder.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Starting point</p>
                      <Button variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                          <Icon name="layout-dashboard" size={18} position="none" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">Executive pulse</span>
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            Revenue, customer health, and operating priorities.
                          </span>
                        </span>
                      </Button>
                      <Button variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          <Icon name="chart-spline" size={18} position="none" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">Revenue forecast</span>
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            Pipeline coverage, scenarios, and close risks.
                          </span>
                        </span>
                      </Button>
                      <Button variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Icon name="users-round" size={18} position="none" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">Customer health</span>
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            Renewal runway, expansion signals, and account risks.
                          </span>
                        </span>
                      </Button>
                      <div className="mt-3 border border-border bg-muted/50 p-4 rounded-md">
                        <p className="font-medium">Recommended for this workspace</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Executive pulse matches the metrics and weekly operating rhythm already used on this dashboard.
                        </p>
                      </div>
                    </div>
                    <DrawerFooter className="border-border">
                      <DrawerClose className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                        Create executive pulse
                      </DrawerClose>
                      <DrawerClose className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
                        Cancel
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-5 pb-14 pt-4 md:px-8">
            <section className="grid grid-cols-12 items-stretch gap-5" aria-label="Morning command deck">

              <Card className="col-span-12 min-h-[340px] border-0 bg-blue-600 py-6 text-white shadow-lg dark:bg-blue-700 xl:col-span-8">
                <CardHeader className="px-6">
                  <CardDescription className="text-white/60">August operating position</CardDescription>
                  <CardTitle className="max-w-xl text-2xl text-white">
                    Growth is compounding faster than plan.
                  </CardTitle>
                  <CardAction>
                    <Select defaultValue="30-days">
                      <SelectTrigger
                        className="min-w-0 border-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:hover:bg-secondary/80"
                        aria-label="Change reporting period"
                      >
                        <SelectValue placeholder="30 days" />
                      </SelectTrigger>
                      <SelectContent align="end" sideOffset={8} className="w-48">
                        <SelectGroup>
                          <SelectLabel>Reporting period</SelectLabel>
                          <SelectItem value="7-days" label="7 days">Last 7 days</SelectItem>
                          <SelectItem value="30-days" label="30 days">Last 30 days</SelectItem>
                          <SelectItem value="quarter-to-date" label="Quarter to date">Quarter to date</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid grid-cols-12 gap-5 px-6 pt-5">
                  <div className="col-span-12 flex flex-col justify-between lg:col-span-7">
                    <div>
                      <p className="text-xs font-medium tracking-wide text-white/55 uppercase">
                        Monthly recurring revenue
                      </p>
                      <p className="mt-3 font-heading text-5xl font-semibold tracking-[-0.045em] tabular-nums md:text-6xl">
                        $148,240
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="xs" shape="pill">+12.8% MoM</Button>
                        <span className="text-sm text-white/65">$16.8k net new MRR this month</span>
                      </div>
                    </div>
                    <Progress
                      value={73}
                      className="mt-8 text-white [&_[data-slot=progress-indicator]]:bg-white [&_[data-slot=progress-track]]:bg-white/20"
                    >
                      <ProgressLabel>Annual plan · $1.42m of $1.94m</ProgressLabel>
                      <ProgressValue className="text-white/70" />
                    </Progress>
                  </div>

                  <div className="col-span-12 grid grid-cols-2 gap-3 lg:col-span-5">
                    <Item className="col-span-1 flex-col items-start border-0 bg-white/10 p-4 text-white">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-white text-blue-700">
                        <Icon name="arrow-up-right" />
                      </ItemMedia>
                      <ItemContent className="mt-5">
                        <ItemDescription className="text-white/55">Expansion MRR</ItemDescription>
                        <ItemTitle className="text-xl text-white tabular-nums">$41.3k</ItemTitle>
                      </ItemContent>
                    </Item>
                    <Item className="col-span-1 flex-col items-start border-0 bg-white/10 p-4 text-white">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-white text-blue-700">
                        <Icon name="refresh-cw" />
                      </ItemMedia>
                      <ItemContent className="mt-5">
                        <ItemDescription className="text-white/55">Net retention</ItemDescription>
                        <ItemTitle className="text-xl text-white tabular-nums">112.4%</ItemTitle>
                      </ItemContent>
                    </Item>
                    <Item className="col-span-2 border-0 bg-white p-4 text-neutral-950">
                      <ItemMedia variant="icon" className="size-10 rounded-xl bg-blue-100 text-blue-700">
                        <Icon name="sparkles" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription>Forecast intelligence</ItemDescription>
                        <ItemTitle>On track to beat Q3 plan by $63k</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <Icon name="arrow-right" size={16} position="none" />
                      </ItemActions>
                    </Item>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-12 min-h-[340px] border-0 bg-neutral-950 py-6 text-neutral-50 shadow-lg dark:bg-neutral-900 xl:col-span-4">
                <CardHeader className="px-6">
                  <CardDescription className="text-neutral-500">Live operating pulse</CardDescription>
                  <CardTitle className="text-xl text-white">Three things need attention</CardTitle>
                  <CardAction>
                    <span className="flex size-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
                  </CardAction>
                </CardHeader>
                <CardContent className="px-6">
                  <ItemGroup className="gap-3">
                    <Item className="border-0 bg-white/10 p-4 text-neutral-50">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-amber-400 text-amber-950">
                        <Icon name="triangle-alert" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="text-white">Cloudroom usage dropped 18%</ItemTitle>
                        <ItemDescription className="text-neutral-400">CS review due before 14:00</ItemDescription>
                      </ItemContent>
                    </Item>
                    <Item className="border-0 bg-white/10 p-4 text-neutral-50">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-violet-400 text-violet-950">
                        <Icon name="flask-conical" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="text-white">Activation test reached 62%</ItemTitle>
                        <ItemDescription className="text-neutral-400">Decision window opens tomorrow</ItemDescription>
                      </ItemContent>
                    </Item>
                    <Item className="border-0 bg-white/10 p-4 text-neutral-50">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-emerald-400 text-emerald-950">
                        <Icon name="handshake" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="text-white">$83k ready to close</ItemTitle>
                        <ItemDescription className="text-neutral-400">7 opportunities above 70%</ItemDescription>
                      </ItemContent>
                    </Item>
                  </ItemGroup>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-12 items-stretch gap-5" aria-label="Key metrics">
              <Card size="default" className="col-span-12 h-full border-0 bg-card shadow-sm sm:col-span-6 xl:col-span-3">
                <CardHeader>
                  <CardDescription>Active accounts</CardDescription>
                  <CardAction>
                    <Icon name="users-round" size={17} position="none" className="text-muted-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl font-semibold tabular-nums">2,846</CardTitle>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-emerald-600">+214</span> net new this month</p>
                </CardContent>
              </Card>
              <Card className="col-span-12 h-full border-0 bg-card shadow-sm sm:col-span-6 xl:col-span-3">
                <CardHeader>
                  <CardDescription>14-day activation</CardDescription>
                  <CardAction>
                    <Icon name="mouse-pointer-click" size={17} position="none" className="text-muted-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl font-semibold tabular-nums">68.7%</CardTitle>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-emerald-600">+4.1 pts</span> versus July</p>
                </CardContent>
              </Card>
              <Card className="col-span-12 h-full border-0 bg-card shadow-sm sm:col-span-6 xl:col-span-3">
                <CardHeader>
                  <CardDescription>Gross revenue churn</CardDescription>
                  <CardAction>
                    <Icon name="shield-check" size={17} position="none" className="text-muted-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl font-semibold tabular-nums">1.74%</CardTitle>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-emerald-600">0.3 pts below</span> target ceiling</p>
                </CardContent>
              </Card>
              <Card className="col-span-12 h-full border-0 bg-card shadow-sm sm:col-span-6 xl:col-span-3">
                <CardHeader>
                  <CardDescription>Runway</CardDescription>
                  <CardAction>
                    <Icon name="calendar-range" size={17} position="none" className="text-muted-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-3xl font-semibold tabular-nums">26 mo</CardTitle>
                  <p className="mt-2 text-xs text-muted-foreground">$3.8m cash · burn multiple 1.2×</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-12 items-stretch gap-5" aria-label="Revenue performance">
              <AreaChartCard
                className="col-span-12 h-full border-0 bg-card shadow-sm xl:col-span-8"
                title="Recurring revenue velocity"
                description="MRR base and expansion contribution · Mar–Aug"
                badge="+18.4%"
                dataCsv="Mar,84,18; Apr,92,21; May,101,24; Jun,110,29; Jul,126,34; Aug,148,41"
                seriesCsv="revenue,Recurring revenue; expansion,Expansion"
                primaryKey="revenue"
                primaryLabel="Recurring revenue"
                secondaryKey="expansion"
                secondaryLabel="Expansion"
                footerTitle="The growth mix improved"
                footerDescription="Expansion now contributes 27.9% of MRR growth, up from 21.4% in March."
                height={310}
                showLegend
              />

              <Card className="col-span-12 h-full border-0 bg-amber-100 py-5 text-amber-950 shadow-sm dark:bg-amber-950/50 dark:text-amber-100 xl:col-span-4">
                <CardHeader>
                  <CardDescription className="text-amber-950/55 dark:text-amber-200/60">Activation sprint · day 9 of 14</CardDescription>
                  <CardTitle className="text-xl text-amber-950 dark:text-amber-100">The new checklist is winning</CardTitle>
                  <CardAction>
                    <Button size="xs" shape="pill" className="bg-amber-950 text-amber-50 dark:bg-amber-300 dark:text-amber-950">Live</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-5xl font-semibold tracking-tight tabular-nums">+11.6%</p>
                  <p className="mt-2 text-sm leading-6 text-amber-950/65 dark:text-amber-200/70">
                    Lift in activated workspaces compared with the control cohort.
                  </p>
                  <ItemGroup className="mt-6 gap-2">
                    <Item className="border-0 bg-amber-50/70 dark:bg-amber-900/35">
                      <ItemContent>
                        <ItemDescription className="text-amber-950/55 dark:text-amber-200/60">Exposed accounts</ItemDescription>
                        <ItemTitle className="text-amber-950 dark:text-amber-100">1,842</ItemTitle>
                      </ItemContent>
                      <ItemActions className="font-semibold tabular-nums">62%</ItemActions>
                    </Item>
                    <Item className="border-0 bg-amber-50/70 dark:bg-amber-900/35">
                      <ItemContent>
                        <ItemDescription className="text-amber-950/55 dark:text-amber-200/60">Confidence</ItemDescription>
                        <ItemTitle className="text-amber-950 dark:text-amber-100">Strong signal</ItemTitle>
                      </ItemContent>
                      <ItemActions className="font-semibold tabular-nums">91%</ItemActions>
                    </Item>
                  </ItemGroup>
                  <Button size="sm" className="mt-5 w-full bg-amber-950 text-amber-50 dark:bg-amber-300 dark:text-amber-950">
                    Open experiment
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-12 items-stretch gap-5" aria-label="Customer operations">
              <div className="col-span-12 flex flex-col gap-5 xl:col-span-8">
                <Card className="border-0 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Accounts to move this week</CardTitle>
                    <CardDescription>Customer movement · $117k ARR represented</CardDescription>
                    <CardAction>
                      <Button variant="secondary" size="sm">Open success workspace</Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <ItemGroup className="grid gap-3 md:grid-cols-2">
                      <Item className="border-0 bg-amber-50 p-4 dark:bg-amber-950/40">
                        <ItemMedia variant="icon" className="size-10 rounded-xl bg-amber-400 text-amber-950">
                          <Icon name="triangle-alert" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Cloudroom</ItemTitle>
                          <ItemDescription>Usage down 18% · champion moved teams</ItemDescription>
                        </ItemContent>
                        <ItemActions className="font-semibold tabular-nums">$18.6k</ItemActions>
                      </Item>
                      <Item className="border-0 bg-emerald-50 p-4 dark:bg-emerald-950/40">
                        <ItemMedia variant="icon" className="size-10 rounded-xl bg-emerald-400 text-emerald-950">
                          <Icon name="trending-up" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Northstar Labs</ItemTitle>
                          <ItemDescription>3 teams activated after upgrade</ItemDescription>
                        </ItemContent>
                        <ItemActions className="font-semibold tabular-nums">$31.2k</ItemActions>
                      </Item>
                      <Item className="border-0 bg-violet-50 p-4 dark:bg-violet-950/40">
                        <ItemMedia variant="icon" className="size-10 rounded-xl bg-violet-400 text-violet-950">
                          <Icon name="message-circle-more" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Onda Health</ItemTitle>
                          <ItemDescription>Executive review · Thu 10:00</ItemDescription>
                        </ItemContent>
                        <ItemActions className="font-semibold tabular-nums">$24.8k</ItemActions>
                      </Item>
                      <Item className="border-0 bg-sky-50 p-4 dark:bg-sky-950/40">
                        <ItemMedia variant="icon" className="size-10 rounded-xl bg-sky-400 text-sky-950">
                          <Icon name="shield-check" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>Linear Works</ItemTitle>
                          <ItemDescription>Security review cleared · expansion ready</ItemDescription>
                        </ItemContent>
                        <ItemActions className="font-semibold tabular-nums">$42.4k</ItemActions>
                      </Item>
                    </ItemGroup>
                  </CardContent>
                </Card>

                <Card className="flex-1 border-0 bg-card py-4 shadow-sm">
                  <CardHeader className="px-5">
                    <CardDescription>Portfolio pulse</CardDescription>
                    <CardTitle className="text-base">This week’s customer momentum</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 px-5 md:grid-cols-3">
                    <Item className="border-0 bg-muted/60 p-3">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Icon name="trending-up" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription>Expansion ready</ItemDescription>
                        <ItemTitle className="tabular-nums">$73.6k</ItemTitle>
                      </ItemContent>
                    </Item>
                    <Item className="border-0 bg-muted/60 p-3">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <Icon name="triangle-alert" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription>Needs attention</ItemDescription>
                        <ItemTitle className="tabular-nums">$43.4k</ItemTitle>
                      </ItemContent>
                    </Item>
                    <Item className="border-0 bg-muted/60 p-3">
                      <ItemMedia variant="icon" className="size-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        <Icon name="calendar-days" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription>Next checkpoint</ItemDescription>
                        <ItemTitle>Thu 10:00</ItemTitle>
                      </ItemContent>
                    </Item>
                  </CardContent>
                </Card>
              </div>

              <Card className="col-span-12 h-full border-0 bg-neutral-950 py-5 text-neutral-50 shadow-sm dark:bg-neutral-900 xl:col-span-4">
                <CardHeader>
                  <CardDescription className="text-neutral-500">Weighted pipeline · 37 deals</CardDescription>
                  <CardTitle className="text-xl text-white">Closing position</CardTitle>
                  <CardAction>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      aria-label="Pipeline actions"
                    >
                      <Icon name="ellipsis" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-5xl font-semibold tracking-tight tabular-nums">$326k</p>
                  <p className="mt-2 text-sm text-neutral-500">1.9× monthly target coverage</p>
                  <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/10">
                    <span className="w-[44%] bg-violet-400" />
                    <span className="w-[31%] bg-amber-400" />
                    <span className="w-[25%] bg-emerald-400" />
                  </div>
                  <ItemGroup className="mt-5 gap-2">
                    <Item className="border-0 px-0 text-neutral-50">
                      <ItemMedia>
                        <span aria-hidden="true" className="size-2.5 rounded-full bg-violet-400" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription className="text-neutral-500">Qualified · 18</ItemDescription>
                        <ItemTitle className="text-white">$142k</ItemTitle>
                      </ItemContent>
                      <ItemActions className="text-neutral-500">44%</ItemActions>
                    </Item>
                    <Item className="border-0 px-0 text-neutral-50">
                      <ItemMedia>
                        <span aria-hidden="true" className="size-2.5 rounded-full bg-amber-400" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription className="text-neutral-500">Proposal · 12</ItemDescription>
                        <ItemTitle className="text-white">$101k</ItemTitle>
                      </ItemContent>
                      <ItemActions className="text-neutral-500">31%</ItemActions>
                    </Item>
                    <Item className="border-0 px-0 text-neutral-50">
                      <ItemMedia>
                        <span aria-hidden="true" className="size-2.5 rounded-full bg-emerald-400" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription className="text-neutral-500">Closing · 7</ItemDescription>
                        <ItemTitle className="text-white">$83k</ItemTitle>
                      </ItemContent>
                      <ItemActions className="text-neutral-500">25%</ItemActions>
                    </Item>
                  </ItemGroup>
                  <Button variant="secondary" size="sm" className="mt-5 w-full">Open revenue workspace</Button>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-12 items-stretch gap-5" aria-label="Growth operations">
              <BarChartCard
                className="col-span-12 h-full border-0 bg-card shadow-sm xl:col-span-8"
                title="Acquisition efficiency"
                description="Pipeline created and activated accounts per $1k spend"
                badge="+14.2%"
                dataCsv="Organic,42,18; Partners,36,15; Events,29,13; Paid,22,16; Outbound,18,11"
                seriesCsv="pipeline,Pipeline created; activated,Activated accounts"
                primaryKey="pipeline"
                primaryLabel="Pipeline created"
                secondaryKey="activated"
                secondaryLabel="Activated accounts"
                footerTitle="Partner motion is breaking out"
                footerDescription="Partner-sourced pipeline grew 26% after the July enablement launch."
                height={290}
                layout="horizontal"
                showLegend
              />

              <Card className="col-span-12 h-full border-0 bg-violet-100 py-5 text-violet-950 shadow-sm dark:bg-violet-950/50 dark:text-violet-100 xl:col-span-4">
                <CardHeader>
                  <CardDescription className="text-violet-950/55 dark:text-violet-200/60">Next 30 days</CardDescription>
                  <CardTitle className="text-xl text-violet-950 dark:text-violet-100">Renewal runway</CardTitle>
                  <CardAction>
                    <Button variant="secondary" size="icon-sm" aria-label="Renewal calendar">
                      <Icon name="calendar-days" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-4xl font-semibold tracking-tight tabular-nums">$92.4k</p>
                  <p className="mt-1 text-sm text-violet-950/55 dark:text-violet-200/60">4 renewals · 96% forecast confidence</p>
                  <ItemGroup className="mt-5 gap-1">
                    <Item className="border-0 px-0">
                      <ItemMedia><Avatar fallback="VE" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Vela Energy</ItemTitle><ItemDescription>Aug 18 · committed</ItemDescription></ItemContent>
                      <ItemActions className="font-semibold">$28.4k</ItemActions>
                    </Item>
                    <Item className="border-0 px-0">
                      <ItemMedia><Avatar fallback="AK" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Arc Kitchens</ItemTitle><ItemDescription>Aug 22 · proposal accepted</ItemDescription></ItemContent>
                      <ItemActions className="font-semibold">$24.0k</ItemActions>
                    </Item>
                    <Item className="border-0 px-0">
                      <ItemMedia><Avatar fallback="HS" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Harbor Systems</ItemTitle><ItemDescription>Aug 27 · procurement</ItemDescription></ItemContent>
                      <ItemActions className="font-semibold">$21.6k</ItemActions>
                    </Item>
                    <Item className="border-0 px-0">
                      <ItemMedia><Avatar fallback="MR" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Monument Retail</ItemTitle><ItemDescription>Sep 02 · expansion</ItemDescription></ItemContent>
                      <ItemActions className="font-semibold">$18.4k</ItemActions>
                    </Item>
                  </ItemGroup>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-12 items-stretch gap-5" aria-label="Weekly execution">
              <Card className="col-span-12 h-full border-0 bg-card shadow-sm xl:col-span-8">
                <CardHeader>
                  <CardDescription>Workspace activity · today</CardDescription>
                  <CardTitle className="text-xl">The team is moving</CardTitle>
                  <CardAction><Button variant="ghost" size="sm">View all</Button></CardAction>
                </CardHeader>
                <CardContent>
                  <ItemGroup className="gap-1">
                    <Item className="border-0 px-0 py-3">
                      <ItemMedia><Avatar fallback="JL" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Jordan upgraded Northstar to Business</ItemTitle><ItemDescription>Revenue · 12 minutes ago</ItemDescription></ItemContent>
                      <ItemActions><Button variant="secondary" size="xs" shape="pill">+$2,400 ARR</Button></ItemActions>
                    </Item>
                    <Item className="border-0 px-0 py-3">
                      <ItemMedia><Avatar fallback="AN" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Amina published the Q3 activation review</ItemTitle><ItemDescription>Analytics · 46 minutes ago</ItemDescription></ItemContent>
                      <ItemActions><Icon name="arrow-up-right" size={15} position="none" /></ItemActions>
                    </Item>
                    <Item className="border-0 px-0 py-3">
                      <ItemMedia><Avatar fallback="TS" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Theo completed the billing v2 rollout</ItemTitle><ItemDescription>Product · 3 hours ago · 100% migrated</ItemDescription></ItemContent>
                      <ItemActions><Button variant="outline" size="xs" shape="pill">Deployed</Button></ItemActions>
                    </Item>
                    <Item className="border-0 px-0 py-3">
                      <ItemMedia><Avatar fallback="CR" size="sm" /></ItemMedia>
                      <ItemContent><ItemTitle>Customer health recovered for Cloudroom</ItemTitle><ItemDescription>Success · 4 hours ago · +21 health points</ItemDescription></ItemContent>
                      <ItemActions><Button variant="secondary" size="xs" shape="pill">Healthy</Button></ItemActions>
                    </Item>
                  </ItemGroup>
                </CardContent>
              </Card>

              <Card className="col-span-12 h-full border-0 bg-card shadow-sm xl:col-span-4">
                <CardHeader>
                  <CardDescription>Operating plan · Aug 12–16</CardDescription>
                  <CardTitle className="text-xl">Friday finish line</CardTitle>
                  <CardAction><Button variant="secondary" size="xs" shape="pill">4 of 6</Button></CardAction>
                </CardHeader>
                <CardContent>
                  <ItemGroup className="gap-2">
                    <Item className="border-0 bg-emerald-50 dark:bg-emerald-950/40">
                      <ItemMedia variant="icon" className="text-emerald-600"><Icon name="circle-check-big" /></ItemMedia>
                      <ItemContent><ItemTitle>Billing v2 rollout</ItemTitle><ItemDescription>Completed Tuesday</ItemDescription></ItemContent>
                    </Item>
                    <Item className="border-0 bg-emerald-50 dark:bg-emerald-950/40">
                      <ItemMedia variant="icon" className="text-emerald-600"><Icon name="circle-check-big" /></ItemMedia>
                      <ItemContent><ItemTitle>Enterprise pricing review</ItemTitle><ItemDescription>Approved by finance and sales</ItemDescription></ItemContent>
                    </Item>
                    <Item className="border-0 bg-violet-50 dark:bg-violet-950/40">
                      <ItemMedia variant="icon" className="text-violet-600"><Icon name="clock-3" /></ItemMedia>
                      <ItemContent><ItemTitle>Activation decision memo</ItemTitle><ItemDescription>Due today · 15:00</ItemDescription></ItemContent>
                    </Item>
                    <Item className="border-0 bg-amber-50 dark:bg-amber-950/40">
                      <ItemMedia variant="icon" className="text-amber-600"><Icon name="circle-dashed" /></ItemMedia>
                      <ItemContent><ItemTitle>Q3 board narrative</ItemTitle><ItemDescription>First draft due by 17:00</ItemDescription></ItemContent>
                    </Item>
                  </ItemGroup>
                  <Button className="mt-5 w-full">
                    Open weekly plan
                    <Icon name="arrow-right" size={14} position="none" />
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Theme>
  );
}
