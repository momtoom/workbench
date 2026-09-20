# Renderer Skeleton

Renderer is separated from the React app shell.

## Folder Intent

- `renderer/core`: renderer contracts that do not depend on bundler or framework
- `renderer/browser`: browser runtime adapter implementation

## Direction

- Canonical state stays in `src/domain/*`
- Projection is built in `src/domain/projection/*`
- Renderer receives projection via `RendererPort`

Vite is only used as a local dev shell for the editor UI, not as product core.
