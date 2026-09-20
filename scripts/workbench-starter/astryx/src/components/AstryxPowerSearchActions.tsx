import {
  AstryxPowerSearchActions as BasePowerSearchActions,
  type AstryxPowerSearchActionsProps,
} from './AstryxPowerSearchEditor';

export type { AstryxPowerSearchActionsProps };

export function AstryxPowerSearchActions(
  props: AstryxPowerSearchActionsProps,
) {
  return <BasePowerSearchActions {...props} />;
}

AstryxPowerSearchActions.displayName = 'AstryxPowerSearchActions';
