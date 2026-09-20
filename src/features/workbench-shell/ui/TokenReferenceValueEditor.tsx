import type { RefObject } from 'react';
import type {
  DesignToken,
  TokenCollection,
  TokenRegistry,
  TokenValue,
} from '@domain/design-system/tokens/types';
import { defaultRawValue } from '@domain/design-system/tokens/operations';
import { ReferenceTokenPicker } from './TokenPicker';

export function ReferenceTokenValueEditor({
  collection,
  popoverAnchorRef,
  registry,
  token,
  update,
  value,
}: {
  collection: TokenCollection;
  popoverAnchorRef?: RefObject<HTMLElement | null>;
  registry: TokenRegistry;
  token: DesignToken;
  update: (value: TokenValue) => void;
  value?: TokenValue;
}) {
  return (
    <ReferenceTokenPicker
      registry={registry}
      selected={value?.kind === 'ref' ? { collectionId: value.collectionId, tokenId: value.tokenId } : null}
      autoOpen={value?.kind !== 'ref'}
      currentCollectionId={collection.id}
      exclude={[{ collectionId: collection.id, tokenId: token.id }]}
      cycleTarget={{ collectionId: collection.id, tokenId: token.id }}
      popoverAnchorRef={popoverAnchorRef}
      onSelect={(ref) => update({ kind: 'ref', collectionId: ref.collectionId, tokenId: ref.tokenId })}
      onClear={() => update({ kind: 'raw', value: defaultRawValue(token.type) })}
      allowedTypes={[token.type]}
    />
  );
}
