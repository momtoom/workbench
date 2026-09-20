import { Button } from '@shared/ui/primitives';
import { formatTokenDeletionImpact, type TokenDeletionImpact } from '@domain/design-system/tokens/impact';
import { ModalLayer } from './ModalLayer';

export type TokenDeletionDialogState = {
  collectionId: string;
  impact: TokenDeletionImpact;
  tokenIds: string[];
  tokenCount: number;
};

export function TokenDeletionDialog({
  deletion,
  onCancel,
  onConfirm,
}: {
  deletion: TokenDeletionDialogState;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const impactText = formatTokenDeletionImpact(deletion.impact);
  const tokenLabel = `${deletion.tokenCount} token${deletion.tokenCount === 1 ? '' : 's'}`;

  return (
    <ModalLayer title={`Delete ${tokenLabel}`} onClose={onCancel}>
      <p className="wb-modal-copy">
        {impactText ?? 'This removes the selected token from the current collection.'}
      </p>
      <div className="wb-modal-actions">
        <Button tone="ghost" onClick={onCancel}>Cancel</Button>
        <Button tone="danger" onClick={onConfirm}>Delete</Button>
      </div>
    </ModalLayer>
  );
}
