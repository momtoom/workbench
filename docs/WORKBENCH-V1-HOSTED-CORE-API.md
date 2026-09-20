# Workbench V1 Hosted Core API

Workbench can load the same web app in a browser, in a browser paired to a
local bridge. The hosted core API is the
server-side boundary for logic that should not ship in renderer JavaScript.

The guiding split is:

```text
Hosted core
  -> authenticate
  -> authorize features
  -> plan operations
  -> validate source-write flush metadata
  -> validate operations
  -> provide private templates/catalogs

Local bridge
  -> choose folders
  -> read scoped project files
  -> write scoped project files
  -> watch local project changes
  -> store local assets
```

The hosted core must not directly access a user's local filesystem. When a
server-planned operation needs to modify local files, it returns an operation
plan. The renderer then asks the local bridge to apply the approved local file
steps.

## Client Configuration

The renderer uses `src/domain/core/workbenchCoreClient.ts`.

Set this env var for remote hosted core calls:

```bash
VITE_WORKBENCH_CORE_URL=https://workbench.example.com
```

By default, source-write validation is advisory: if hosted core is unavailable,
local editing keeps working. To require hosted core validation before source
writes, build the renderer with:

```bash
VITE_WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN=true
```

The hosted core exposes the matching runtime feature as
`remote-source-write-required`. For server/runtime reporting, set:

```bash
WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN=true
```

## Vercel Deployment

Deploy from a staged copy instead of the repository root:

```bash
npm run deploy:vercel
```

The script creates a small `/tmp/workbench-v1-vercel-src.*` source directory
with only the Vercel app inputs:

- `src`, `renderer`, `public`
- `api`, `server`
- `scripts` required by `vite.config.ts`
- package, Vite, TypeScript, and Vercel config files

It intentionally excludes local-only or heavy folders such as `.git`,
`.claude`, `node_modules`, `projects`, `release`, and existing `dist` output.
This keeps production deployments focused on the hosted UI/core code and avoids
uploading local project data or packaged desktop artifacts.

For a preview deployment:

```bash
npm run deploy:vercel -- --preview
```

If the env var is missing, the client stays in `local-fallback` mode. Local
editing and the local bridge continue to work, but remote operation planning,
private templates, and server-gated features are disabled.

Only `https://...` core URLs are accepted, except loopback `http://127.0.0.1`,
`http://localhost`, and `http://[::1]` for development.

## Endpoints

### `POST /api/workbench/session/bootstrap`

Used when the app starts or a project opens. It tells the hosted core which
shell and storage adapter are active without uploading project source.

Request:

```json
{
  "protocolVersion": 1,
  "client": {
    "shell": "browser",
    "storageKind": "local-folder"
  },
  "project": {
    "projectId": "project-id",
    "projectName": "DESIGNOPS2",
    "storageKind": "local-folder",
    "configPath": ".workbench/workbench.config.json",
    "counts": {
      "assets": 3,
      "comments": 0,
      "components": 12,
      "pages": 2,
      "tokenCollections": 1,
      "tokens": 240
    }
  }
}
```

Response:

```json
{
  "ok": true,
  "mode": "remote",
  "protocolVersion": 1,
  "features": [
    {
      "id": "remote-operation-planning",
      "enabled": true
    },
    {
      "id": "remote-source-write-validation",
      "enabled": true
    },
    {
      "id": "remote-source-write-required",
      "enabled": false
    }
  ]
}
```

### `GET /api/workbench/features`

Returns feature flags and entitlement decisions for the current authenticated
user/session.

Response:

```json
[
  {
    "id": "remote-template-catalog",
    "enabled": true
  },
  {
    "id": "remote-operation-planning",
    "enabled": true
  },
  {
    "id": "remote-source-write-validation",
    "enabled": true
  },
  {
    "id": "remote-source-write-required",
    "enabled": false
  }
]
```

### `GET /api/workbench/templates`

Returns private page/component/token templates. Template source can live on the
server, but any resulting local file write must still flow through an operation
plan and local bridge application.

Response:

```json
[
  {
    "id": "dashboard-page",
    "name": "Dashboard page",
    "kind": "page",
    "description": "Source-backed page scaffold"
  }
]
```

### `POST /api/workbench/operations/plan`

Plans a server-assisted operation. This is the main boundary for private logic,
AI orchestration, design analysis, template expansion, or licensing-gated edit
planning.

Request:

```json
{
  "protocolVersion": 1,
  "intent": "validate-edit",
  "project": {
    "projectId": "project-id",
    "projectName": "DESIGNOPS2",
    "storageKind": "local-folder",
    "configPath": ".workbench/workbench.config.json",
    "counts": {
      "assets": 3,
      "comments": 0,
      "components": 12,
      "pages": 2,
      "tokenCollections": 1,
      "tokens": 240
    }
  },
  "selection": {
    "activeTargetKind": "page",
    "sourceFile": "src/workbench-pages/Home.tsx",
    "nodeId": "node-id"
  },
  "constraints": {
    "allowSourceWrites": true,
    "allowAssetWrites": false,
    "maxPatchBytes": 200000
  },
  "operation": {
    "kind": "source.write",
    "sourceFile": "src/workbench-pages/Home.tsx",
    "subjectKind": "page",
    "subjectId": "home",
    "subjectName": "Home",
    "label": "Set source text content",
    "trigger": "auto",
    "byteLength": 18422,
    "contentHash": "18422:4100361324"
  }
}
```

Response:

```json
{
  "ok": true,
  "mode": "remote",
  "plan": {
    "id": "hosted-source-write-...",
    "createdAt": "2026-06-18T00:00:00.000Z",
    "summary": "Validated source write for src/workbench-pages/Home.tsx.",
    "steps": [
      {
        "kind": "message",
        "body": "Hosted core validated Set source text content for DESIGNOPS2. Source: src/workbench-pages/Home.tsx..."
      }
    ]
  }
}
```

The first connected edit path uses this as an advisory gate before source
history flushes write through the local bridge. If hosted core is unavailable,
local source editing continues by default and the bridge remains the scoped
file-write authority. Set `VITE_WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN=true` to
make this fail-closed on the client. Once login and allowlist gating are
enabled, this same hook can enforce protected editing features per user.

Allowed step kinds:

- `message`: present user-facing guidance without local file writes
- `source.patch`: apply a patch to a scoped project file through the bridge
- `source.write`: write a scoped project file through the bridge
- `asset.write`: write a project asset through the bridge

### `POST /api/workbench/source/analyze`

Analyzes an explicitly provided TSX/source snapshot on the hosted core. The
hosted core does not read local files; the renderer must send source contents
only after the user or feature flow has explicitly chosen that context.

Request:

```json
{
  "protocolVersion": 1,
  "source": {
    "sourceFile": "src/workbench-pages/Home.tsx",
    "contents": "export function Home() { return <main>Hello</main>; }",
    "preferredComponentNames": ["Home"]
  }
}
```

Response:

```json
{
  "ok": true,
  "mode": "remote",
  "protocolVersion": 1,
  "analysis": {
    "sourceFile": "src/workbench-pages/Home.tsx",
    "byteLength": 57,
    "parseable": true,
    "primaryComponentName": "Home",
    "exportedComponents": ["Home"],
    "jsx": {
      "elements": 1,
      "componentInstances": 0,
      "intrinsicElements": 1,
      "maxDepth": 1,
      "textNodes": 1
    },
    "diagnostic": "Hosted core parsed src/workbench-pages/Home.tsx and found Home."
  }
}
```

This is the first hosted-engine slice. The full editable-tree projection can
move behind this boundary after source-context approval and result comparison
are in place.

## Security Rules

- Do not send full local project source to hosted core by default.
- Send summaries, selected file snippets, or explicit user-approved context
  only when a feature requires it.
- Hosted core may produce operation plans, but local bridge validates paths and
  applies writes.
- Hosted core must never receive the local bridge bearer token.
- Renderer JavaScript is not a secret boundary; private logic belongs behind
  hosted core APIs.
- Local bridge remains bound to loopback and keeps scoped file access checks.
- Installed browser sessions enter through an approved loopback gateway. The
  gateway proxies hosted renderer/core traffic and local preview/bridge routes
  under one local origin; the bridge bearer token never enters a hosted URL.
  The companion prefers `http://127.0.0.1:4318/` so browser-local state
  remains available across restarts, with an ephemeral port only as a conflict
  fallback.

## First Implementation Milestone

1. Configure `VITE_WORKBENCH_CORE_URL` for development, or deploy the renderer
   and `api/` functions to the same `https://` origin.
2. Call `createWorkbenchCoreClient().bootstrap(...)` after project load.
3. Render feature availability from `/api/workbench/features`.
4. Use `/api/workbench/source/analyze` for explicit source snapshot analysis.
5. Use `/api/workbench/operations/plan` as an advisory source-write validation
   gate before source history flushes write through the local bridge.
6. Add executable source/asset write steps only after plan preview and local bridge apply
   review are implemented.

## Vercel Deployment Note

Deploy the staged source copy created by `npm run deploy:vercel`, not the
generated `dist/` folder and not the full local repository. `vercel.json` sets
`npm run build` and `dist` as the static output directory while preserving
root-level `api/workbench/**` functions in the deployment.
