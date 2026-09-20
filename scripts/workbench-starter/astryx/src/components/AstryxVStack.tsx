import { AstryxStack, type AstryxStackProps } from './AstryxStack';

export type AstryxVStackProps = Omit<AstryxStackProps, 'direction'>;

export function AstryxVStack(props: AstryxVStackProps) {
  return <AstryxStack {...props} direction="vertical" />;
}
