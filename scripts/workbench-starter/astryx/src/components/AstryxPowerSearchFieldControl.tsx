import {
  AstryxPowerSearchFieldControl as BasePowerSearchFieldControl,
  type AstryxPowerSearchFieldControlProps,
} from './AstryxPowerSearchEditor';

export type { AstryxPowerSearchFieldControlProps };

export function AstryxPowerSearchFieldControl(
  props: AstryxPowerSearchFieldControlProps,
) {
  return <BasePowerSearchFieldControl {...props} />;
}

AstryxPowerSearchFieldControl.displayName = 'AstryxPowerSearchFieldControl';
