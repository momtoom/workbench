import type { TokenRegistry, TokenValue } from '@domain/design-system/tokens/types';
import { isGradientValue } from '@domain/design-system/tokens/types';
import { isCssGradientLiteral } from '@domain/design-system/tokens/gradient';
import type { resolveTokenValue } from '@domain/design-system/tokens/resolver';
import { stringifyResolved } from '@domain/design-system/tokens/query';

export function formatTokenCellLabel(
  value: TokenValue | undefined,
  resolved: ReturnType<typeof resolveTokenValue>,
  registry: TokenRegistry,
): string {
  if (!value) return 'Empty';
  if (value.kind === 'ref') {
    const found = registry.collections
      .find((collection) => collection.id === value.collectionId)
      ?.tokens.find((token) => token.id === value.tokenId);
    return found ? found.name : 'Missing token';
  }
  if (value.kind === 'formula') return stringifyResolved(resolved);
  if (value.kind === 'raw' && isGradientValue(value.value)) return 'Gradient';
  if (value.kind === 'raw' && isCssGradientLiteral(value.value)) return 'Gradient';
  return stringifyResolved(resolved);
}
