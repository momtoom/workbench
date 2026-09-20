import { Icon as ShadcnIcon } from "./icon"
import { asBoolean, asNumber, asOption, asText } from "./story-utils"

type Args = {
  color?: boolean | string
  decorative?: boolean | string
  name?: boolean | string
  nonScalingStroke?: boolean | string
  position?: boolean | string
  size?: boolean | number | string
  strokeWidth?: boolean | number | string
  title?: boolean | string
}
const POSITIONS = ["inline-start", "inline-end", "none"] as const

const DEFAULT_PROPS = {
  title: "",
  name: "circle-user",
  strokeWidth: 2,
  position: "inline-start",
  size: 16,
  color: "",
  decorative: true,
  nonScalingStroke: false,
} as const

const meta = {
  title: "shadcn/Base UI/Icon",
  component: ShadcnIcon,
  authoring: {
    group: 'Media',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: "text" },
    name: { control: "icon" },
    strokeWidth: { control: { type: "number", min: 0, max: 6, step: 0.25 } },
    position: { control: "select", options: POSITIONS },
    size: { control: { type: "number", min: 8, max: 64, step: 1 } },
    color: { control: "text" },
    decorative: { control: "boolean" },
    nonScalingStroke: { control: "boolean" },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
}
export default meta

export const Icon = {
  name: "Icon",
  render: (args: Args) => (
    <ShadcnIcon
      color={asText(args.color, DEFAULT_PROPS.color)}
      decorative={asBoolean(args.decorative, DEFAULT_PROPS.decorative)}
      name={asText(args.name, DEFAULT_PROPS.name)}
      nonScalingStroke={asBoolean(args.nonScalingStroke, DEFAULT_PROPS.nonScalingStroke)}
      position={asOption(args.position, POSITIONS, DEFAULT_PROPS.position)}
      size={asNumber(args.size, DEFAULT_PROPS.size)}
      strokeWidth={asNumber(args.strokeWidth, DEFAULT_PROPS.strokeWidth)}
      title={asText(args.title, DEFAULT_PROPS.title)}
    />
  ),
}
