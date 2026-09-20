import {
  AstryxPowerSearchValueControl as BasePowerSearchValueControl,
  type AstryxPowerSearchValueControlProps,
} from './AstryxPowerSearchEditor';

export type { AstryxPowerSearchValueControlProps };

export function AstryxPowerSearchValueControl(
  props: AstryxPowerSearchValueControlProps,
) {
  return <BasePowerSearchValueControl {...props} />;
}

AstryxPowerSearchValueControl.displayName = 'AstryxPowerSearchValueControl';
