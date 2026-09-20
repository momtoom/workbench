import type { RefObject } from 'react';
import type { DesignToken, TokenCollection, TokenRegistry, TokenValue } from '@domain/design-system/tokens/types';
import { RawTokenValueEditor } from './TokenRawValueEditor';
import { ReferenceTokenValueEditor } from './TokenReferenceValueEditor';

type TokenInlineValueEditorProps = {
  collection: TokenCollection;
  kind: TokenValue['kind'];
  openGradient: () => void;
  registry: TokenRegistry;
  popoverAnchorRef?: RefObject<HTMLElement | null>;
  token: DesignToken;
  updateDraft: (value: TokenValue) => void;
  value?: TokenValue;
};

export function TokenInlineValueEditor({
  collection,
  kind,
  openGradient,
  popoverAnchorRef,
  registry,
  token,
  updateDraft,
  value,
}: TokenInlineValueEditorProps) {
  if (kind === 'raw' && value?.kind === 'raw') {
    return (
      <RawTokenValueEditor
        openGradient={openGradient}
        registry={registry}
        token={token}
        update={(rawValue) => updateDraft({ kind: 'raw', value: rawValue })}
        value={value.value}
      />
    );
  }

  if (kind === 'ref') {
    return (
      <ReferenceTokenValueEditor
        collection={collection}
        popoverAnchorRef={popoverAnchorRef}
        registry={registry}
        token={token}
        update={(ref) => updateDraft(ref)}
        value={value}
      />
    );
  }

  return null;
}
