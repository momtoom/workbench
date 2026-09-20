import type { FormulaUnit, TokenType } from './types';

export function supportsTokenFormula(type: TokenType): boolean {
  return type === 'number' || getFormulaUnits(type) !== null;
}

export function getDefaultFormulaUnit(type: TokenType): FormulaUnit | undefined {
  return getFormulaUnits(type)?.[0];
}

export function getFormulaUnits(type: TokenType): FormulaUnit[] | null {
  if (type === 'dimension') return ['rem', 'px', 'em', '%', 'vh', 'vw'];
  if (type === 'duration') return ['ms', 's'];
  if (type === 'angle') return ['deg', 'rad', 'turn'];
  if (type === 'opacity') return ['%', 'number'];
  return null;
}

export function getFormulaReferenceTypes(type: TokenType): TokenType[] {
  return getFormulaUnits(type) ? ['number', type] : ['number'];
}
