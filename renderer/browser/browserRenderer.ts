import type { RenderDocumentProjection, RendererPort } from '../core/rendererContract';

export function createBrowserRenderer(): RendererPort {
  let container: HTMLElement | null = null;

  return {
    mount(target) {
      container = target;
      container.dataset.renderer = 'workbench-v1-browser';
    },
    update(projection: RenderDocumentProjection) {
      if (!container) {
        return;
      }

      container.replaceChildren(createAssetPreview(projection));
    },
    unmount() {
      if (!container) {
        return;
      }

      container.innerText = '';
      delete container.dataset.renderer;
      container = null;
    },
  };
}

function createAssetPreview(projection: RenderDocumentProjection): HTMLElement {
  const activeAsset =
    projection.assets.find((asset) => asset.id === projection.activeAssetId) ??
    projection.assets[0];
  const tokenMap = new Map(projection.tokens.map((token) => [token.id, token.value]));
  const background = tokenMap.get(activeAsset?.bindings.background ?? '') ?? '#4d73ff';
  const radius = tokenMap.get(activeAsset?.bindings.radius ?? '') ?? '8px';
  const spacing = tokenMap.get(activeAsset?.bindings.spacing ?? '') ?? '10px 14px';
  const siblingAssets = projection.assets.filter(
    (asset) => asset.component === activeAsset?.component,
  );

  const stage = document.createElement('div');
  stage.className = 'wb-render-stage';
  stage.dataset.wbSurface = 'asset-preview';

  const card = document.createElement('article');
  card.className = 'wb-render-card';
  card.dataset.wbAssetId = activeAsset?.id ?? '';
  card.dataset.wbComponent = activeAsset?.component ?? 'Unknown';
  card.dataset.wbVariant = activeAsset?.variant ?? 'default';
  card.dataset.wbState = activeAsset?.state ?? 'default';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'wb-render-eyebrow';
  eyebrow.textContent = 'Library asset preview';

  const title = document.createElement('h2');
  title.className = 'wb-render-title';
  title.textContent = activeAsset?.label ?? 'No asset selected';

  const button = document.createElement('button');
  button.className = 'wb-render-button';
  button.type = 'button';
  button.dataset.wbAssetId = activeAsset?.id ?? '';
  button.dataset.wbTokenBackground = activeAsset?.bindings.background ?? '';
  button.dataset.wbTokenRadius = activeAsset?.bindings.radius ?? '';
  button.dataset.wbTokenSpacing = activeAsset?.bindings.spacing ?? '';
  button.style.background = background;
  button.style.borderRadius = radius;
  button.style.padding = spacing;
  button.textContent = activeAsset?.component === 'Input' ? 'Placeholder input' : 'Create asset';

  const meta = document.createElement('p');
  meta.className = 'wb-render-meta';
  meta.textContent = `${activeAsset?.variant ?? 'variant'} / ${activeAsset?.state ?? 'state'}`;

  card.append(eyebrow, title, button, meta);

  const set = document.createElement('div');
  set.className = 'wb-render-set';

  for (const asset of siblingAssets) {
    const swatch = document.createElement('button');
    swatch.className =
      asset.id === activeAsset?.id
        ? 'wb-render-set__item wb-render-set__item--active'
        : 'wb-render-set__item';
    swatch.type = 'button';
    swatch.dataset.wbAssetId = asset.id;
    swatch.dataset.wbComponent = asset.component;
    swatch.dataset.wbVariant = asset.variant;
    swatch.dataset.wbState = asset.state;
    swatch.style.background =
      tokenMap.get(asset.bindings.background) ?? '#263248';
    swatch.style.borderRadius =
      tokenMap.get(asset.bindings.radius) ?? '8px';
    swatch.style.padding =
      tokenMap.get(asset.bindings.spacing) ?? '10px 14px';
    swatch.textContent = `${asset.variant} / ${asset.state}`;
    set.append(swatch);
  }

  stage.append(card, set);

  return stage;
}
