import { useEffect, useState } from 'react';
import { defaultRawValue } from '@domain/design-system/tokens/operations';
import { cssGradientLiteralToValue, isCssGradientLiteral } from '@domain/design-system/tokens/gradient';
import type { TokenType, TokenValue } from '@domain/design-system/tokens/types';
import { isGradientValue } from '@domain/design-system/tokens/types';

type UseTokenValueDraftOptions = {
  isEditing: boolean;
  modeId: string;
  persistedValue: TokenValue | undefined;
  setEditing: (editing: boolean) => void;
  tokenType: TokenType;
  updateValue: (value: TokenValue) => void;
};

export function useTokenValueDraft({
  isEditing,
  modeId,
  persistedValue,
  setEditing,
  tokenType,
  updateValue,
}: UseTokenValueDraftOptions) {
  const [draftValue, setDraftValue] = useState<TokenValue | null>(null);
  const [requestedKind, setRequestedKind] = useState<TokenValue['kind'] | null>(null);
  const [gradientOpen, setGradientOpen] = useState(false);
  const value = isEditing ? draftValue ?? persistedValue : persistedValue;
  const kind = tokenType === 'gradient'
    ? getGradientEditableValueKind(requestedKind ?? value?.kind ?? 'raw')
    : getEditableValueKind(requestedKind ?? value?.kind ?? 'raw');
  const gradientModalValue = draftValue ?? persistedValue;
  const canApplyDraft = isDraftReadyToApply(kind, draftValue);

  useEffect(() => {
    if (isEditing) {
      setDraftValue(getEditableTokenValue(persistedValue, tokenType));
    } else {
      setDraftValue(null);
      setRequestedKind(null);
      setGradientOpen(false);
    }
  }, [isEditing, modeId, persistedValue, tokenType]);

  function updateDraft(nextValue: TokenValue) {
    setRequestedKind(null);
    setDraftValue(nextValue);
  }

  function applyDraft() {
    if (!canApplyDraft || !draftValue) return;
    updateValue(draftValue);
    setEditing(false);
  }

  function cancelDraft() {
    setDraftValue(null);
    setRequestedKind(null);
    setEditing(false);
  }

  function changeKind(nextKind: TokenValue['kind']) {
    setRequestedKind(nextKind);
    if (nextKind === 'raw') updateDraft({ kind: 'raw', value: defaultRawValue(tokenType) });
    if (nextKind === 'ref') setDraftValue(null);
  }

  function openValueEditor() {
    if (tokenType === 'gradient' && persistedValue?.kind === 'raw') {
      if (isGradientValue(persistedValue.value)) {
        setDraftValue(null);
        setGradientOpen(true);
        return;
      }
      if (isCssGradientLiteral(persistedValue.value)) {
        const gradientValue = cssGradientLiteralToValue(persistedValue.value);
        if (gradientValue) {
          setDraftValue({ kind: 'raw', value: gradientValue });
          setGradientOpen(true);
          return;
        }
      }
    }
    setEditing(true);
  }

  function closeGradientEditor() {
    if (draftValue) updateValue(draftValue);
    setDraftValue(null);
    setGradientOpen(false);
    setEditing(false);
  }

  return {
    changeKind,
    closeGradientEditor,
    draftValue,
    gradientModalValue,
    gradientOpen,
    kind,
    canApplyDraft,
    openValueEditor,
    setGradientOpen,
    updateDraft,
    value,
    applyDraft,
    cancelDraft,
  };
}

function cloneTokenValue(value: TokenValue): TokenValue {
  return JSON.parse(JSON.stringify(value)) as TokenValue;
}

function getEditableTokenValue(value: TokenValue | undefined, tokenType: TokenType): TokenValue {
  if (value && value.kind !== 'formula') return cloneTokenValue(value);
  return { kind: 'raw', value: defaultRawValue(tokenType) };
}

function getEditableValueKind(kind: TokenValue['kind']): Exclude<TokenValue['kind'], 'formula'> {
  return kind === 'ref' ? 'ref' : 'raw';
}

function getGradientEditableValueKind(kind: TokenValue['kind']): Exclude<TokenValue['kind'], 'formula'> {
  return kind === 'ref' ? 'ref' : 'raw';
}

function isDraftReadyToApply(kind: TokenValue['kind'], value: TokenValue | null): boolean {
  if (!value) return false;
  if (kind === 'ref') return value.kind === 'ref';
  return value.kind === 'raw';
}
