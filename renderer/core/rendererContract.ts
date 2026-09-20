export type RenderNodeProjection = {
  viewNodeId: string;
  kind: 'container' | 'text';
  label: string;
  children?: RenderNodeProjection[];
};

export type RenderTokenProjection = {
  id: string;
  value: string;
};

export type RenderAssetProjection = {
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

export type RenderDocumentProjection = {
  documentId: string | null;
  nodes: RenderNodeProjection[];
  activeAssetId: string | null;
  tokens: RenderTokenProjection[];
  assets: RenderAssetProjection[];
};

export type RendererPort = {
  mount: (target: HTMLElement) => void;
  update: (projection: RenderDocumentProjection) => void;
  unmount: () => void;
};
