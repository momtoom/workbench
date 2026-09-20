import type { TokenPickerResult } from '@domain/design-system/tokens/query';

export const TOKEN_PICKER_POPOVER_WIDTH = 420;
export const TOKEN_PICKER_INSPECTOR_POPOVER_WIDTH = 320;
export const TOKEN_PICKER_POPOVER_MAX_HEIGHT = 492;
export const TOKEN_PICKER_INSPECTOR_POPOVER_MAX_HEIGHT = 360;
export const TOKEN_PICKER_POPOVER_GAP = 8;
export const TOKEN_PICKER_CLOSE_EVENT = 'workbench:token-picker-close';
export const TOKEN_PICKER_OPEN_EVENT = 'workbench:token-picker-open';

export type TokenPickerVariant = 'reference' | 'gradient-color' | 'inspector';
export type TokenPickerCopy = { placeholder: string; title: string };
export type TokenPickerPopoverLayout = { left: number; maxHeight: number; top: number; width: number };

export function getTokenPickerResultId(pickerId: string, result: TokenPickerResult): string {
  return `${pickerId}-result-${encodeURIComponent(result.collection.id)}-${encodeURIComponent(result.token.id)}`;
}

export function getTokenPickerCopy(variant: TokenPickerVariant): TokenPickerCopy {
  if (variant === 'gradient-color') return { placeholder: 'Select color token', title: 'Select color token' };
  if (variant === 'inspector') return { placeholder: 'Select token', title: 'Select field token' };
  return { placeholder: 'Select token', title: 'Token library' };
}

export function getTokenPickerPopoverLayout(anchor: DOMRect | null, variant: TokenPickerVariant = 'reference'): TokenPickerPopoverLayout {
  const preferredWidth = variant === 'inspector' ? TOKEN_PICKER_INSPECTOR_POPOVER_WIDTH : TOKEN_PICKER_POPOVER_WIDTH;
  const preferredMaxHeight = variant === 'inspector' ? TOKEN_PICKER_INSPECTOR_POPOVER_MAX_HEIGHT : TOKEN_PICKER_POPOVER_MAX_HEIGHT;

  if (!anchor) {
    return {
      left: TOKEN_PICKER_POPOVER_GAP,
      maxHeight: preferredMaxHeight,
      top: TOKEN_PICKER_POPOVER_GAP,
      width: preferredWidth,
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportGap = TOKEN_PICKER_POPOVER_GAP;
  const width = Math.min(preferredWidth, Math.max(280, viewportWidth - viewportGap * 2));
  const spaceBelow = viewportHeight - anchor.bottom - viewportGap;
  const spaceAbove = anchor.top - viewportGap;
  const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
  const availableHeight = openAbove ? spaceAbove - viewportGap : spaceBelow - viewportGap;
  const maxHeight = clamp(availableHeight, 180, preferredMaxHeight);
  const top = openAbove ? Math.max(viewportGap, anchor.top - maxHeight - viewportGap) : anchor.bottom + viewportGap;
  const left = clamp(
    anchor.left,
    viewportGap,
    Math.max(viewportGap, viewportWidth - width - viewportGap),
  );

  return { left, maxHeight, top, width };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
