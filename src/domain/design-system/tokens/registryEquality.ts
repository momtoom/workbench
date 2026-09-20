import type { TokenRegistry } from './types';

export function cloneTokenRegistry(registry: TokenRegistry): TokenRegistry {
  return JSON.parse(JSON.stringify(registry)) as TokenRegistry;
}

export function areTokenRegistriesEqual(left: TokenRegistry, right: TokenRegistry): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
