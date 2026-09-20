import {
  AstryxPowerSearchAction as BasePowerSearchAction,
  type AstryxPowerSearchActionProps,
} from './AstryxPowerSearchEditor';

export type { AstryxPowerSearchActionProps };

export function AstryxPowerSearchAction(
  props: AstryxPowerSearchActionProps,
) {
  return <BasePowerSearchAction {...props} />;
}

AstryxPowerSearchAction.displayName = 'AstryxPowerSearchAction';
