export type TokenCategory = 'color' | 'spacing' | 'radius';

export type DesignToken = {
  id: string;
  label: string;
  category: TokenCategory;
  value: string;
};

export type LibraryAsset = {
  id: string;
  component: string;
  variant: string;
  state: string;
  label: string;
  bindings: {
    background: string;
    radius: string;
    spacing: string;
  };
};

export type AssetComment = {
  id: string;
  assetId: string;
  body: string;
};

export type DesignSystemState = {
  tokens: DesignToken[];
  assets: LibraryAsset[];
  comments: AssetComment[];
};

export const initialDesignSystemState: DesignSystemState = {
  tokens: [
    {
      id: 'color.action.primary',
      label: 'Action Primary',
      category: 'color',
      value: '#4d73ff',
    },
    {
      id: 'color.action.secondary',
      label: 'Action Secondary',
      category: 'color',
      value: '#263248',
    },
    {
      id: 'color.action.danger',
      label: 'Action Danger',
      category: 'color',
      value: '#e05263',
    },
    {
      id: 'space.control.md',
      label: 'Control Medium',
      category: 'spacing',
      value: '10px 14px',
    },
    {
      id: 'space.control.lg',
      label: 'Control Large',
      category: 'spacing',
      value: '12px 18px',
    },
    {
      id: 'radius.control.md',
      label: 'Control Medium',
      category: 'radius',
      value: '8px',
    },
    {
      id: 'radius.control.full',
      label: 'Control Pill',
      category: 'radius',
      value: '999px',
    },
  ],
  assets: [
    {
      id: 'button.primary.default',
      component: 'Button',
      variant: 'primary',
      state: 'default',
      label: 'Button / primary',
      bindings: {
        background: 'color.action.primary',
        radius: 'radius.control.md',
        spacing: 'space.control.md',
      },
    },
    {
      id: 'button.primary.hover',
      component: 'Button',
      variant: 'primary',
      state: 'hover',
      label: 'Button / primary / hover',
      bindings: {
        background: 'color.action.primary',
        radius: 'radius.control.full',
        spacing: 'space.control.lg',
      },
    },
    {
      id: 'button.secondary.default',
      component: 'Button',
      variant: 'secondary',
      state: 'default',
      label: 'Button / secondary',
      bindings: {
        background: 'color.action.secondary',
        radius: 'radius.control.md',
        spacing: 'space.control.md',
      },
    },
    {
      id: 'button.danger.disabled',
      component: 'Button',
      variant: 'danger',
      state: 'disabled',
      label: 'Button / danger / disabled',
      bindings: {
        background: 'color.action.danger',
        radius: 'radius.control.md',
        spacing: 'space.control.md',
      },
    },
    {
      id: 'input.default.default',
      component: 'Input',
      variant: 'default',
      state: 'default',
      label: 'Input / default',
      bindings: {
        background: 'color.action.primary',
        radius: 'radius.control.md',
        spacing: 'space.control.md',
      },
    },
    {
      id: 'card.compact.default',
      component: 'Card',
      variant: 'compact',
      state: 'default',
      label: 'Card / compact',
      bindings: {
        background: 'color.action.primary',
        radius: 'radius.control.md',
        spacing: 'space.control.md',
      },
    },
  ],
  comments: [
    {
      id: 'comment-1',
      assetId: 'button.primary.default',
      body: 'Primary button needs one designer pass for hierarchy.',
    },
    {
      id: 'comment-2',
      assetId: 'button.primary.hover',
      body: 'Hover shape should validate against pill radius before promotion.',
    },
  ],
};

export function updateTokenValue(
  state: DesignSystemState,
  tokenId: string,
  value: string,
): DesignSystemState {
  return {
    ...state,
    tokens: state.tokens.map((token) =>
      token.id === tokenId ? { ...token, value } : token,
    ),
  };
}

export function addAssetComment(
  state: DesignSystemState,
  assetId: string,
  body: string,
): DesignSystemState {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return state;
  }

  return {
    ...state,
    comments: [
      ...state.comments,
      {
        id: `comment-${state.comments.length + 1}`,
        assetId,
        body: trimmedBody,
      },
    ],
  };
}

export function getTokenValue(state: DesignSystemState, tokenId: string): string {
  return state.tokens.find((token) => token.id === tokenId)?.value ?? '';
}
