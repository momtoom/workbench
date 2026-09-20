import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

type CarouselCardItem = {
  badge?: string
  description: string
  metric: string
  title: string
}

type CarouselCardsProps = React.ComponentProps<"section"> & {
  actionLabel?: string
  align?: React.ComponentProps<typeof Carousel>["align"]
  description?: string
  items?: CarouselCardItem[]
  itemSize?: "single" | "half" | "third"
  loop?: boolean
  showAction?: boolean
  showBadges?: boolean
  showControls?: boolean
  title?: string
}

const itemSizeClassNames = {
  single: "basis-full",
  half: "basis-full sm:basis-1/2",
  third: "basis-full sm:basis-1/2 lg:basis-1/3",
} as const

const defaultItems: CarouselCardItem[] = [
  {
    badge: "1",
    description: "Supporting detail for this card.",
    metric: "123",
    title: "Card title 1",
  },
  {
    badge: "2",
    description: "Supporting detail for this card.",
    metric: "456",
    title: "Card title 2",
  },
  {
    badge: "3",
    description: "Supporting detail for this card.",
    metric: "789",
    title: "Card title 3",
  },
]

function CarouselCards({
  actionLabel = "Action",
  align = "start",
  className,
  description = "Carousel card description.",
  items = defaultItems,
  itemSize = "third",
  loop = false,
  showAction = true,
  showBadges = true,
  showControls = true,
  title = "Carousel cards",
  ...props
}: CarouselCardsProps) {
  return (
    <section className={className} {...props}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showAction ? (
            <CardAction>
              <Button variant="outline" size="sm">{actionLabel}</Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="px-12 py-6">
          <Carousel align={align} controlOffset="2.25rem" loop={loop}>
            <CarouselContent>
              {items.map((item) => (
                <CarouselItem key={item.title} className={cn(itemSizeClassNames[itemSize])}>
                  <Card className="h-full border-border/80 shadow-none">
                    <CardHeader>
                      <CardDescription>{item.title}</CardDescription>
                      <CardTitle className="text-3xl">{item.metric}</CardTitle>
                      {showBadges && item.badge ? (
                        <CardAction>
                          <Badge variant="secondary">{item.badge}</Badge>
                        </CardAction>
                      ) : null}
                    </CardHeader>
                    <CardFooter className="text-sm text-muted-foreground">
                      {item.description}
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {showControls ? (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            ) : null}
          </Carousel>
        </CardContent>
      </Card>
    </section>
  )
}

export { CarouselCards, type CarouselCardItem }
