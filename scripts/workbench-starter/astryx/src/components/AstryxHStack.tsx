import { AstryxStack, type AstryxStackProps } from './AstryxStack';

export type AstryxHStackProps = Omit<AstryxStackProps, 'direction'>;

export function AstryxHStack(props: AstryxHStackProps) {
  return <AstryxStack {...props} direction="horizontal" />;
}
