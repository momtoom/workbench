import { ArrowDownToLine } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';
import type { DesignToken, TokenValue } from '@domain/design-system/tokens/types';
import { InlineEditActions } from './InlineEditControls';
import { ValueKindSelect } from './TokenValuePrimitives';

type TokenValueEditControlsProps = {
  copyFromValue?: TokenValue;
  kind: TokenValue['kind'];
  onCancel: () => void;
  onCommit: () => void;
  onCopyFromValue: () => void;
  onKindChange: (kind: TokenValue['kind']) => void;
  token: DesignToken;
  value?: TokenValue;
};

export function TokenValueEditControls({
  copyFromValue,
  kind,
  onCancel,
  onCommit,
  onCopyFromValue,
  onKindChange,
  token,
  value,
}: TokenValueEditControlsProps) {
  return (
    <div className="wb-token-value-edit-controls">
      <TokenValueKindSelect
        kind={kind}
        onKindChange={onKindChange}
        token={token}
      />
      <InlineEditActions onCancel={onCancel} onCommit={onCommit}>
        {copyFromValue && isEmptyValue(value) ? (
          <IconButton label="Copy first mode value" title="Copy first mode value" onClick={onCopyFromValue}>
            <ArrowDownToLine size={13} />
          </IconButton>
        ) : null}
      </InlineEditActions>
    </div>
  );
}

function TokenValueKindSelect({
  kind,
  onKindChange,
  token,
}: {
  kind: TokenValue['kind'];
  onKindChange: (kind: TokenValue['kind']) => void;
  token: DesignToken;
}) {
  return (
    <ValueKindSelect
      ariaLabel={`${token.name} value kind`}
      kind={kind}
      onKindChange={onKindChange}
    />
  );
}

function isEmptyValue(value: TokenValue | undefined): boolean {
  return !value || (value.kind === 'raw' && value.value === '');
}
