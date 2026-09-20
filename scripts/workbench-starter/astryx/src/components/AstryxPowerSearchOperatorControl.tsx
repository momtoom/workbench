import {
  AstryxPowerSearchOperatorControl as BasePowerSearchOperatorControl,
  type AstryxPowerSearchOperatorControlProps,
} from './AstryxPowerSearchEditor';

export type { AstryxPowerSearchOperatorControlProps };

export function AstryxPowerSearchOperatorControl(
  props: AstryxPowerSearchOperatorControlProps,
) {
  return <BasePowerSearchOperatorControl {...props} />;
}

AstryxPowerSearchOperatorControl.displayName = 'AstryxPowerSearchOperatorControl';
