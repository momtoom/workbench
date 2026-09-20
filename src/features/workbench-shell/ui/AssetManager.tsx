import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Copy, FileImage, FileType2, FileVideo, GitBranch, ImagePlus, Link, Maximize2, Minimize2, Plus, Shapes, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, IconButton, SearchField, SelectControl, TextField } from '@shared/ui/primitives';
import type {
  WorkbenchAssetRegistry,
  WorkbenchDesignAsset,
  WorkbenchDesignAssetKind,
} from '@domain/project/workbenchProject';
import {
  createDesignAssetFromFile,
  createDesignAssetFromUrl,
  DESIGN_ASSET_ACCEPT,
  getDesignAssetCssSnippet,
  getDesignAssetRuntimeCssSnippet,
  getDesignAssetRuntimeValue,
  getDesignAssetUsageValue,
  getEffectiveDesignAssetKind,
  getWorkbenchAssetRuntimeValue,
  getWorkbenchAssetDefaults,
  getWorkbenchFontAssetFamily,
  getWorkbenchFontDefaultLabel,
  getWorkbenchIconPreviewOptions,
  inferDesignAssetKindFromSource,
  inferDesignAssetKind,
  removeDesignAsset,
  setWorkbenchFontDefault,
  setWorkbenchIconDefault,
  upsertDesignAssets,
  getWorkbenchImagePreviewOptions,
  WORKBENCH_FONT_DEFAULT_SLOTS,
  type WorkbenchIconPreviewOption,
  type WorkbenchFontDefaultSlot,
} from '@domain/design-system/assets/assetRegistry';
import {
  deleteWorkbenchAssetFiles,
  installWorkbenchAssetsFromGit,
  installWorkbenchGoogleFont,
  searchWorkbenchGoogleFonts,
  writeWorkbenchAssetFile,
  type WorkbenchGoogleFontOption,
} from '@domain/project/workbenchProjectLoader';
import {
  WorkbenchEditorFrame,
  WorkbenchEditorPanelBody,
  WorkbenchEditorSidebar,
  WorkbenchEditorSurface,
  WorkbenchEditorToolbar,
  WorkbenchResizeHandle,
} from './WorkbenchEditorShell';
import {
  WorkbenchSidebarMeta,
  WorkbenchSidebarRow,
  WorkbenchSidebarRowList,
  WorkbenchSidebarSectionHeader,
} from './WorkbenchSidebarPrimitives';
import { ModalField, ModalFieldList, ModalLayer } from './ModalLayer';
import { WorkbenchInspectorSection } from './WorkbenchInspectorPrimitives';

type AssetManagerProps = {
  assets: WorkbenchAssetRegistry;
  onAssetsChange: (assets: WorkbenchAssetRegistry) => void;
  sidebarWidth: number;
  startSidebarWidthResize: (event: React.PointerEvent<HTMLButtonElement>) => void;
  surfaceNav: React.ReactNode;
};

type AssetKindFilter = 'all' | WorkbenchDesignAssetKind;
type AssetLibraryInstallSource = 'git' | 'google-fonts';
type GitInstallKind = 'font' | 'icon';
type InstallFontDefaultSlot = 'none' | WorkbenchFontDefaultSlot;
type SvgFileInstallMode = 'icon-set' | 'icon-files' | 'image-collection' | 'image-files';
type RasterImageInstallMode = 'image-collection' | 'image-files';
type AssetCollectionKind = Extract<WorkbenchDesignAssetKind, 'icon' | 'image'>;

export function AssetManager({
  assets,
  onAssetsChange,
  sidebarWidth,
  startSidebarWidthResize,
  surfaceNav,
}: AssetManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestAssetsRef = useRef(assets);
  const assetFileMutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assets.assets[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<AssetKindFilter>('all');
  const [urlDraft, setUrlDraft] = useState('');
  const [urlNameDraft, setUrlNameDraft] = useState('');
  const [urlKind, setUrlKind] = useState<WorkbenchDesignAssetKind>('image');
  const [urlInstallOpen, setUrlInstallOpen] = useState(false);
  const [svgFileMode, setSvgFileMode] = useState<SvgFileInstallMode>('icon-files');
  const [rasterImageMode, setRasterImageMode] = useState<RasterImageInstallMode>('image-collection');
  const [svgIconSetNameDraft, setSvgIconSetNameDraft] = useState('');
  const [pendingFileImports, setPendingFileImports] = useState<File[]>([]);
  const [gitInstallOpen, setGitInstallOpen] = useState(false);
  const [assetInstallSource, setAssetInstallSource] = useState<AssetLibraryInstallSource>('git');
  const [gitKind, setGitKind] = useState<GitInstallKind>('icon');
  const [gitNameDraft, setGitNameDraft] = useState('');
  const [gitUrlDraft, setGitUrlDraft] = useState('');
  const [googleFontSearchDraft, setGoogleFontSearchDraft] = useState('');
  const [googleFontFamilyDraft, setGoogleFontFamilyDraft] = useState('');
  const [googleFontOptions, setGoogleFontOptions] = useState<WorkbenchGoogleFontOption[]>([]);
  const [googleFontSource, setGoogleFontSource] = useState<'fallback' | 'google-fonts' | null>(null);
  const [googleFontSearching, setGoogleFontSearching] = useState(false);
  const [googleFontSearchMessage, setGoogleFontSearchMessage] = useState<string | null>(null);
  const [googleFontWeightsDraft, setGoogleFontWeightsDraft] = useState('400,500,600,700');
  const [gitSetDefault, setGitSetDefault] = useState(true);
  const [gitFontDefaultSlot, setGitFontDefaultSlot] = useState<InstallFontDefaultSlot>('sansAssetId');
  const [gitInstalling, setGitInstalling] = useState(false);
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  latestAssetsRef.current = assets;

  function commitAssetsChange(nextAssets: WorkbenchAssetRegistry) {
    latestAssetsRef.current = nextAssets;
    onAssetsChange(nextAssets);
  }

  function queueAssetFileMutation<T>(operation: () => Promise<T>): Promise<T> {
    const queued = assetFileMutationQueueRef.current.catch(() => undefined).then(operation);
    assetFileMutationQueueRef.current = queued.then(() => undefined, () => undefined);
    return queued;
  }

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assets.assets.filter((asset) => {
      const effectiveKind = getEffectiveDesignAssetKind(asset);
      if (kindFilter !== 'all' && effectiveKind !== kindFilter) return false;
      if (!normalizedQuery) return true;
      return [
        asset.name,
        asset.fileName,
        asset.mimeType,
        effectiveKind,
        ...asset.tags,
      ].filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedQuery));
    });
  }, [assets.assets, kindFilter, query]);

  const selectedAsset = assets.assets.find((asset) => asset.id === selectedAssetId) ?? filteredAssets[0] ?? null;
  const assetDefaults = useMemo(() => getWorkbenchAssetDefaults(assets), [assets]);
  const iconAssets = useMemo(() => assets.assets.filter((asset) => asset.kind === 'icon'), [assets.assets]);
  const fontAssets = useMemo(() => assets.assets.filter((asset) => asset.kind === 'font'), [assets.assets]);

  useEffect(() => {
    if (!gitInstallOpen || assetInstallSource !== 'google-fonts') return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setGoogleFontSearching(true);
      void searchWorkbenchGoogleFonts({ limit: 36, query: googleFontSearchDraft }).then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setGoogleFontOptions([]);
          setGoogleFontSource(null);
          setGoogleFontSearchMessage(result.message);
          return;
        }
        setGoogleFontOptions(result.fonts);
        setGoogleFontSource(result.source);
        setGoogleFontSearchMessage(result.message ?? null);
      }).finally(() => {
        if (!cancelled) setGoogleFontSearching(false);
      });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [assetInstallSource, gitInstallOpen, googleFontSearchDraft]);

  async function importFiles(files: FileList | File[], svgKind?: Extract<WorkbenchDesignAssetKind, 'icon' | 'image'>) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    try {
      const importedAssets = await Promise.all(fileArray.map(async (file) => (
        queueAssetFileMutation(() => installProjectAssetFile(
          file,
          svgKind && isSvgDesignAssetFile(file) ? svgKind : undefined,
        ))
      )));
      const nextAssets = upsertDesignAssets(latestAssetsRef.current, importedAssets);
      commitAssetsChange(nextAssets);
      setSelectedAssetId(importedAssets[0]?.id ?? selectedAssetId);
      setStatus(`${importedAssets.length} asset${importedAssets.length === 1 ? '' : 's'} installed`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Asset import failed');
    }
  }

  function handleFileInstallSelection(files: File[]) {
    if (files.length === 0) return;
    const svgFiles = files.filter(isSvgDesignAssetFile);
    if (svgFiles.length > 0) {
      setPendingFileImports(files);
      setSvgFileMode(svgFiles.length > 1 ? 'icon-set' : 'icon-files');
      setSvgIconSetNameDraft(inferSvgIconSetName(svgFiles));
      return;
    }
    const rasterImageFiles = files.filter(isRasterImageAssetFile);
    if (rasterImageFiles.length > 1) {
      setPendingFileImports(files);
      setRasterImageMode('image-collection');
      setSvgIconSetNameDraft(inferImageCollectionName(rasterImageFiles));
      return;
    }
    void importFiles(files);
  }

  function cancelPendingFileInstall() {
    setPendingFileImports([]);
  }

  async function installPendingFiles() {
    const files = pendingFileImports;
    const mode = svgFileMode;
    const setName = svgIconSetNameDraft;
    const hasSvgFiles = files.some(isSvgDesignAssetFile);
    setPendingFileImports([]);
    setSvgIconSetNameDraft('');

    if (!hasSvgFiles) {
      if (rasterImageMode !== 'image-collection') {
        await importFiles(files);
        return;
      }
      try {
        const imageFiles = files.filter(isRasterImageAssetFile);
        const otherFiles = files.filter((file) => !isRasterImageAssetFile(file));
        const importedAssets = await Promise.all([
          ...otherFiles.map((file) => queueAssetFileMutation(() => installProjectAssetFile(file))),
          ...(imageFiles.length > 0
            ? [queueAssetFileMutation(() => installProjectImageCollectionAsset(imageFiles, setName))]
            : []),
        ]);
        const nextAssets = upsertDesignAssets(latestAssetsRef.current, importedAssets);
        commitAssetsChange(nextAssets);
        setSelectedAssetId(importedAssets[0]?.id ?? selectedAssetId);
        setStatus(`${importedAssets.length} asset${importedAssets.length === 1 ? '' : 's'} installed`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Asset import failed');
      }
      return;
    }

    if (mode === 'image-collection') {
      try {
        const svgFiles = files.filter(isSvgDesignAssetFile);
        const otherFiles = files.filter((file) => !isSvgDesignAssetFile(file));
        const importedAssets = await Promise.all([
          ...otherFiles.map((file) => queueAssetFileMutation(() => installProjectAssetFile(file))),
          ...(svgFiles.length > 0
            ? [queueAssetFileMutation(() => installProjectImageCollectionAsset(svgFiles, setName))]
            : []),
        ]);
        const nextAssets = upsertDesignAssets(latestAssetsRef.current, importedAssets);
        commitAssetsChange(nextAssets);
        setSelectedAssetId(importedAssets[0]?.id ?? selectedAssetId);
        setStatus(`${importedAssets.length} asset${importedAssets.length === 1 ? '' : 's'} installed`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Asset import failed');
      }
      return;
    }

    if (mode !== 'icon-set') {
      await importFiles(files, mode === 'image-files' ? 'image' : 'icon');
      return;
    }

    try {
      const svgFiles = files.filter(isSvgDesignAssetFile);
      const otherFiles = files.filter((file) => !isSvgDesignAssetFile(file));
      const importedAssets = await Promise.all([
        ...otherFiles.map((file) => queueAssetFileMutation(() => installProjectAssetFile(file))),
        ...(svgFiles.length > 0
          ? [queueAssetFileMutation(() => installProjectIconSetAsset(svgFiles, setName))]
          : []),
      ]);
      const nextAssets = upsertDesignAssets(latestAssetsRef.current, importedAssets);
      commitAssetsChange(nextAssets);
      setSelectedAssetId(importedAssets[0]?.id ?? selectedAssetId);
      setStatus(`${importedAssets.length} asset${importedAssets.length === 1 ? '' : 's'} installed`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Asset import failed');
    }
  }

  function installUrlAsset() {
    const url = urlDraft.trim();
    if (!url) {
      setStatus('Enter an asset URL first');
      return;
    }
    const name = urlNameDraft.trim() || inferNameFromUrl(url);
    const asset = createDesignAssetFromUrl({
      kind: inferDesignAssetKindFromSource(url, urlKind),
      name,
      url,
    });
    commitAssetsChange(upsertDesignAssets(latestAssetsRef.current, [asset]));
    setSelectedAssetId(asset.id);
    setUrlDraft('');
    setUrlNameDraft('');
    setUrlInstallOpen(false);
    setStatus('URL asset installed');
  }

  async function installGitAssets() {
    const url = gitUrlDraft.trim();
    if (!url) {
      setStatus('Enter a Git repository URL first');
      return;
    }

    setGitInstalling(true);
    setStatus('Installing assets from Git...');
    try {
      const result = await queueAssetFileMutation(() => installWorkbenchAssetsFromGit({
        kind: gitKind,
        name: gitNameDraft.trim() || undefined,
        url,
      }));
      if (!result.ok) {
        setStatus(result.message);
        return;
      }

      let nextAssets = upsertDesignAssets(latestAssetsRef.current, result.assets);
      const firstInstalled = result.assets[0] ?? null;
      if (firstInstalled && gitSetDefault) {
        if (gitKind === 'icon' && firstInstalled.kind === 'icon') {
          nextAssets = setWorkbenchIconDefault(nextAssets, firstInstalled.id);
        }
        if (gitKind === 'font' && firstInstalled.kind === 'font' && gitFontDefaultSlot !== 'none') {
          nextAssets = setWorkbenchFontDefault(nextAssets, gitFontDefaultSlot, firstInstalled.id);
        }
      }
      commitAssetsChange(nextAssets);
      setSelectedAssetId(firstInstalled?.id ?? selectedAssetId);
      setGitUrlDraft('');
      setGitNameDraft('');
      setGitInstallOpen(false);
      setStatus(`${result.assets.length} asset${result.assets.length === 1 ? '' : 's'} installed from Git`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Git install failed');
    } finally {
      setGitInstalling(false);
    }
  }

  async function installGoogleFontAssets() {
    const family = googleFontFamilyDraft.trim() || googleFontSearchDraft.trim();
    if (!family) {
      setStatus('Choose a Google Fonts family first');
      return;
    }

    setGitInstalling(true);
    setStatus('Installing Google Font...');
    try {
      const result = await queueAssetFileMutation(() => installWorkbenchGoogleFont({
        family,
        name: gitNameDraft.trim() || undefined,
        weights: parseGoogleFontWeights(googleFontWeightsDraft),
      }));
      if (!result.ok) {
        setStatus(result.message);
        return;
      }

      let nextAssets = upsertDesignAssets(latestAssetsRef.current, result.assets);
      const firstInstalled = result.assets[0] ?? null;
      if (firstInstalled?.kind === 'font' && gitSetDefault && gitFontDefaultSlot !== 'none') {
        nextAssets = setWorkbenchFontDefault(nextAssets, gitFontDefaultSlot, firstInstalled.id);
      }
      commitAssetsChange(nextAssets);
      setSelectedAssetId(firstInstalled?.id ?? selectedAssetId);
      setGoogleFontFamilyDraft('');
      setGoogleFontSearchDraft('');
      setGitNameDraft('');
      setGitInstallOpen(false);
      setStatus(`${result.assets.length} Google Font asset${result.assets.length === 1 ? '' : 's'} installed`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google Font install failed');
    } finally {
      setGitInstalling(false);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied`);
    } catch {
      setStatus('Copy failed');
    }
  }

  function deleteSelectedAsset(asset: WorkbenchDesignAsset) {
    const nextAssets = removeDesignAsset(latestAssetsRef.current, asset.id);
    commitAssetsChange(nextAssets);
    setSelectedAssetId(nextAssets.assets[0]?.id ?? null);
    setStatus('Asset removed');
    if (fileInputRef.current) fileInputRef.current.value = '';
    void queueAssetFileMutation(() => deleteAssetFilesOnDisk(asset));
  }

  async function deleteAssetFilesOnDisk(asset: WorkbenchDesignAsset) {
    if (asset.source.type !== 'project-file' || !asset.source.filePath) return;
    const extensions = asset.extensions ?? {};
    const isInstalledSet = Array.isArray(extensions.previewIcons) || Array.isArray(extensions.previewImages) || Array.isArray(extensions.fontFaces);
    const targetPath = isInstalledSet
      ? asset.source.filePath.replace(/\/[^/]+$/, '')
      : asset.source.filePath;
    if (!targetPath || !targetPath.includes('workbench-assets/')) return;
    const result = await deleteWorkbenchAssetFiles([targetPath]);
    if (!result.ok) {
      setStatus(`Asset removed (files: ${result.message})`);
    }
  }

  function setFontDefault(slot: WorkbenchFontDefaultSlot, asset: WorkbenchDesignAsset) {
    commitAssetsChange(setWorkbenchFontDefault(latestAssetsRef.current, slot, asset.id));
    setStatus(`${asset.name} set as ${getWorkbenchFontDefaultLabel(slot)} font`);
  }

  function clearFontDefault(slot: WorkbenchFontDefaultSlot) {
    commitAssetsChange(setWorkbenchFontDefault(latestAssetsRef.current, slot, null));
    setStatus(`${getWorkbenchFontDefaultLabel(slot)} font default cleared`);
  }

  function setIconDefault(asset: WorkbenchDesignAsset) {
    commitAssetsChange(setWorkbenchIconDefault(latestAssetsRef.current, asset.id));
    setStatus(`${asset.name} set as default icon`);
  }

  function clearIconDefault() {
    commitAssetsChange(setWorkbenchIconDefault(latestAssetsRef.current, null));
    setStatus('Default icon set cleared');
  }

  function setAssetCollectionKind(asset: WorkbenchDesignAsset, collectionKind: AssetCollectionKind) {
    const currentKind = getAssetCollectionKind(asset);
    if (!currentKind || currentKind === collectionKind) return;
    if (collectionKind === 'icon' && !canAssetCollectionUseIconKind(asset)) {
      setStatus('Only SVG image collections can become icon sets');
      return;
    }
    const nextAsset = convertAssetCollectionKind(asset, collectionKind);
    let nextAssets = upsertDesignAssets(latestAssetsRef.current, [nextAsset]);
    if (assetDefaults.iconAssetId === asset.id && collectionKind !== 'icon') {
      nextAssets = setWorkbenchIconDefault(nextAssets, null);
    }
    commitAssetsChange(nextAssets);
    setStatus(`${asset.name} set as ${collectionKind === 'icon' ? 'icon set' : 'image collection'}`);
  }

  function selectGoogleFont(font: WorkbenchGoogleFontOption) {
    setGoogleFontFamilyDraft(font.family);
    setGoogleFontWeightsDraft(formatGoogleFontWeightsForInstall(font));
    setGitNameDraft(font.family);
  }

  return (
    <WorkbenchEditorFrame
      ariaLabel="Asset Manager"
      className="wb-asset-manager"
      sidebarWidth={sidebarWidth}
    >
      <WorkbenchEditorSidebar
        ariaLabel="Asset library"
        className="wb-assets-sidebar"
        navigation={surfaceNav}
      >
        <WorkbenchSidebarSectionHeader
          title="Assets"
          trailing={(
            <span className="wb-assets-section-actions">
              <WorkbenchSidebarMeta>{assets.assets.length}</WorkbenchSidebarMeta>
              <span className="wb-assets-section-action-buttons">
              <IconButton
                label="Install asset files"
                title="Install asset files"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
              >
                <Plus size={13} />
              </IconButton>
              <IconButton
                label="Install asset URL"
                title="Install asset URL"
                aria-expanded={urlInstallOpen}
                onClick={() => setUrlInstallOpen((open) => !open)}
              >
                <Link size={13} />
              </IconButton>
              <IconButton
                label="Install asset library"
                title="Install asset library"
                aria-expanded={gitInstallOpen}
                onClick={() => setGitInstallOpen((open) => !open)}
              >
                <GitBranch size={13} />
              </IconButton>
              </span>
            </span>
          )}
        />

        <AssetDefaultsPanel
          defaults={assetDefaults}
          fontAssets={fontAssets}
          iconAssets={iconAssets}
          onClearFontDefault={clearFontDefault}
          onClearIconDefault={clearIconDefault}
          onSetFontDefault={setFontDefault}
          onSetIconDefault={setIconDefault}
        />

        <div className="wb-assets-toolbar">
          <SearchField
            aria-label="Search assets"
            placeholder="Search assets"
            value={query}
            onValueChange={setQuery}
          />
          <SelectControl<AssetKindFilter>
            aria-label="Filter asset kind"
            value={kindFilter}
            onValueChange={setKindFilter}
          >
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="font">Fonts</option>
            <option value="icon">Icons</option>
          </SelectControl>
        </div>

        <input
          ref={fileInputRef}
          className="wb-assets-file-input"
          type="file"
          accept={DESIGN_ASSET_ACCEPT}
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            handleFileInstallSelection(files);
          }}
        />

        {pendingFileImports.length > 0 ? (
          <ModalLayer
            className="wb-assets-url-modal"
            title={pendingFileImports.some(isSvgDesignAssetFile) ? 'Install SVG files' : 'Install image files'}
            onClose={cancelPendingFileInstall}
          >
            <ModalFieldList ariaLabel="Install asset fields">
              {pendingFileImports.some(isSvgDesignAssetFile) ? (
                <ModalField label="SVG type" meta={`${pendingFileImports.filter(isSvgDesignAssetFile).length} SVG file${pendingFileImports.filter(isSvgDesignAssetFile).length === 1 ? '' : 's'}`}>
                  <SelectControl<SvgFileInstallMode>
                    aria-label="SVG install mode"
                    value={svgFileMode}
                    onValueChange={setSvgFileMode}
                  >
                    <option value="icon-set">Icon set</option>
                    <option value="icon-files">Individual icons</option>
                    <option value="image-collection">Image collection</option>
                    <option value="image-files">Images</option>
                  </SelectControl>
                </ModalField>
              ) : (
                <ModalField label="Install as" meta={`${pendingFileImports.filter(isRasterImageAssetFile).length} image file${pendingFileImports.filter(isRasterImageAssetFile).length === 1 ? '' : 's'}`}>
                  <SelectControl<RasterImageInstallMode>
                    aria-label="Image install mode"
                    value={rasterImageMode}
                    onValueChange={setRasterImageMode}
                  >
                    <option value="image-collection">Image collection</option>
                    <option value="image-files">Individual images</option>
                  </SelectControl>
                </ModalField>
              )}
              {(pendingFileImports.some(isSvgDesignAssetFile) ? svgFileMode === 'icon-set' || svgFileMode === 'image-collection' : rasterImageMode === 'image-collection') ? (
                <ModalField label="Set name">
                  <TextField
                    aria-label="Asset set name"
                    placeholder="Set name"
                    value={svgIconSetNameDraft}
                    onValueChange={setSvgIconSetNameDraft}
                  />
                </ModalField>
              ) : null}
              <ModalField label="Files">
                <div className="wb-assets-pending-files">
                  {pendingFileImports.slice(0, 6).map((file) => (
                    <span key={`${file.name}:${file.size}`}>{file.name}</span>
                  ))}
                  {pendingFileImports.length > 6 ? <span>+{pendingFileImports.length - 6} more</span> : null}
                </div>
              </ModalField>
            </ModalFieldList>
            <div className="wb-modal-actions">
              <Button onClick={cancelPendingFileInstall}>Cancel</Button>
              <Button className="wb-icon-text-button" tone="primary" onClick={installPendingFiles}>
                <Plus size={13} />
                <span>Install files</span>
              </Button>
            </div>
          </ModalLayer>
        ) : null}

        {urlInstallOpen ? (
          <ModalLayer className="wb-assets-url-modal" title="Install asset URL" onClose={() => setUrlInstallOpen(false)}>
            <ModalFieldList ariaLabel="Install URL asset fields">
              <ModalField label="Type">
                <SelectControl<WorkbenchDesignAssetKind>
                  aria-label="URL asset kind"
                  value={urlKind}
                  onValueChange={setUrlKind}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="icon">Icon</option>
                  <option value="font">Font</option>
                </SelectControl>
              </ModalField>
              <ModalField label="Name" meta="Optional">
                <TextField aria-label="Asset name" placeholder="Name" value={urlNameDraft} onValueChange={setUrlNameDraft} />
              </ModalField>
              <ModalField label="URL">
                <TextField aria-label="Asset URL" placeholder="https://..." value={urlDraft} onValueChange={setUrlDraft} />
              </ModalField>
            </ModalFieldList>
            <div className="wb-modal-actions">
              <Button onClick={() => setUrlInstallOpen(false)}>Cancel</Button>
              <Button className="wb-icon-text-button" tone="primary" onClick={installUrlAsset}>
                <Plus size={13} />
                <span>Add URL</span>
              </Button>
            </div>
          </ModalLayer>
        ) : null}

        {gitInstallOpen ? (
          <ModalLayer className="wb-assets-url-modal" title="Install asset library" onClose={() => setGitInstallOpen(false)}>
            <ModalFieldList ariaLabel="Install asset library fields">
              <ModalField label="Source">
                <SelectControl<AssetLibraryInstallSource>
                  aria-label="Asset library source"
                  value={assetInstallSource}
                  onValueChange={setAssetInstallSource}
                >
                  <option value="git">Git URL</option>
                  <option value="google-fonts">Google Fonts</option>
                </SelectControl>
              </ModalField>
              {assetInstallSource === 'git' ? (
                <>
                  <ModalField label="Type">
                    <SelectControl<GitInstallKind>
                      aria-label="Git asset kind"
                      value={gitKind}
                      onValueChange={setGitKind}
                    >
                      <option value="icon">Icon set</option>
                      <option value="font">Fonts</option>
                    </SelectControl>
                  </ModalField>
                  <ModalField label="Name" meta="Optional">
                    <TextField aria-label="Git asset name" placeholder={gitKind === 'icon' ? 'Icon set name' : 'Font family name'} value={gitNameDraft} onValueChange={setGitNameDraft} />
                  </ModalField>
                  <ModalField label="Git URL">
                    <TextField aria-label="Git repository URL" placeholder="https://github.com/org/repo.git" value={gitUrlDraft} onValueChange={setGitUrlDraft} />
                  </ModalField>
                </>
              ) : (
                <>
                  <ModalField label="Search">
                    <TextField aria-label="Search Google Fonts" placeholder="Search Google Fonts" value={googleFontSearchDraft} onValueChange={setGoogleFontSearchDraft} />
                  </ModalField>
                  <ModalField label="Family">
                    <GoogleFontPicker
                      fonts={googleFontOptions}
                      message={googleFontSearchMessage}
                      searching={googleFontSearching}
                      selectedFamily={googleFontFamilyDraft}
                      source={googleFontSource}
                      onSelect={selectGoogleFont}
                    />
                  </ModalField>
                  <ModalField label="Name" meta="Optional">
                    <TextField aria-label="Installed font name" placeholder="Project font name" value={gitNameDraft} onValueChange={setGitNameDraft} />
                  </ModalField>
                  <ModalField label="Weights" meta="Optional">
                    <TextField aria-label="Google Fonts weights" placeholder="400,500,600,700" value={googleFontWeightsDraft} onValueChange={setGoogleFontWeightsDraft} />
                  </ModalField>
                </>
              )}
              <ModalField label="Default">
                <label className="wb-assets-default-checkbox">
                  <input
                    checked={gitSetDefault}
                    type="checkbox"
                    onChange={(event) => setGitSetDefault(event.target.checked)}
                  />
                  <span>{assetInstallSource === 'git' && gitKind === 'icon' ? 'Set as default icon set' : 'Set installed font as default'}</span>
                </label>
              </ModalField>
              {(assetInstallSource === 'google-fonts' || gitKind === 'font') && gitSetDefault ? (
                <ModalField label="Font slot">
                  <SelectControl<InstallFontDefaultSlot>
                    aria-label="Installed font default slot"
                    value={gitFontDefaultSlot}
                    onValueChange={setGitFontDefaultSlot}
                  >
                    {WORKBENCH_FONT_DEFAULT_SLOTS.map((option) => (
                      <option key={option.slot} value={option.slot}>{option.label}</option>
                    ))}
                    <option value="none">Do not set</option>
                  </SelectControl>
                </ModalField>
              ) : null}
            </ModalFieldList>
            <div className="wb-modal-actions">
              <Button onClick={() => setGitInstallOpen(false)}>Cancel</Button>
              <Button className="wb-icon-text-button" disabled={gitInstalling} tone="primary" onClick={() => void (assetInstallSource === 'git' ? installGitAssets() : installGoogleFontAssets())}>
                <GitBranch size={13} />
                <span>{gitInstalling ? 'Installing...' : 'Install'}</span>
              </Button>
            </div>
          </ModalLayer>
        ) : null}

        <WorkbenchSidebarRowList ariaLabel="Installed assets" className="wb-assets-list" density="compact">
          {filteredAssets.length === 0 ? (
            <div className="wb-assets-empty">
              <ImagePlus size={18} />
              <strong>No assets yet</strong>
              <span>Install images, videos, SVG icons, or font files.</span>
            </div>
          ) : filteredAssets.map((asset) => (
            <WorkbenchSidebarRow
              key={asset.id}
              density="compact"
              label={asset.name}
              leading={<AssetThumb asset={asset} />}
              meta={getEffectiveDesignAssetKind(asset)}
              onSelect={() => setSelectedAssetId(asset.id)}
              rowId={asset.id}
              selected={asset.id === selectedAsset?.id}
              actionsWidth={30}
              actions={(
                <IconButton label={`Delete ${asset.name}`} title="Delete asset" tone="danger" onClick={() => deleteSelectedAsset(asset)}>
                  <Trash2 size={13} />
                </IconButton>
              )}
            />
          ))}
        </WorkbenchSidebarRowList>
      </WorkbenchEditorSidebar>

      <WorkbenchResizeHandle
        label="Resize asset sidebar"
        placement="sidebar"
        title="Resize asset sidebar"
        onPointerDown={startSidebarWidthResize}
      />

      <WorkbenchEditorSurface className="wb-assets-surface" ariaLabel="Asset preview">
        <WorkbenchEditorToolbar
          title={selectedAsset?.name ?? 'Asset Preview'}
          meta={selectedAsset ? `${getEffectiveDesignAssetKind(selectedAsset)}${selectedAsset.fileName ? ` · ${selectedAsset.fileName}` : ''}` : 'Select an asset'}
          actions={selectedAsset ? (
            <>
              <Button className="wb-icon-text-button" onClick={() => void copyValue(getDesignAssetUsageValue(selectedAsset), 'Asset value')}>
                <Copy size={13} />
                <span>Value</span>
              </Button>
              <Button className="wb-icon-text-button" onClick={() => void copyValue(getDesignAssetCssSnippet(selectedAsset), 'CSS snippet')}>
                <Copy size={13} />
                <span>CSS</span>
              </Button>
              <Button className="wb-icon-text-button" onClick={() => setPreviewZoomed((zoomed) => !zoomed)}>
                {previewZoomed ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{previewZoomed ? 'Fit' : 'Zoom'}</span>
              </Button>
              <Button className="wb-icon-text-button" tone="danger" onClick={() => deleteSelectedAsset(selectedAsset)}>
                <Trash2 size={13} />
                <span>Delete</span>
              </Button>
            </>
          ) : null}
        />
        <WorkbenchEditorPanelBody className="wb-assets-preview-body">
          {selectedAsset ? (
            <AssetDetail
              asset={selectedAsset}
              defaults={assetDefaults}
              onSetCollectionKind={setAssetCollectionKind}
              onSetFontDefault={setFontDefault}
              onSetIconDefault={setIconDefault}
              previewZoomed={previewZoomed}
            />
          ) : (
            <section className="wb-assets-detail wb-assets-detail--empty">
              <ImagePlus size={22} />
              <strong>Install an asset to start</strong>
            </section>
          )}
        </WorkbenchEditorPanelBody>
        {status ? <div className="wb-assets-status" role="status">{status}</div> : null}
      </WorkbenchEditorSurface>
    </WorkbenchEditorFrame>
  );
}

function GoogleFontPicker({
  fonts,
  message,
  onSelect,
  searching,
  selectedFamily,
  source,
}: {
  fonts: WorkbenchGoogleFontOption[];
  message: string | null;
  onSelect: (font: WorkbenchGoogleFontOption) => void;
  searching: boolean;
  selectedFamily: string;
  source: 'fallback' | 'google-fonts' | null;
}) {
  return (
    <div className="wb-assets-google-font-picker">
      <div className="wb-assets-google-font-picker__head">
        <span>{selectedFamily || 'Choose a family'}</span>
        <small>{searching ? 'Searching...' : source === 'fallback' ? 'Fallback list' : `${fonts.length} results`}</small>
      </div>
      {message ? <small className="wb-assets-google-font-picker__message">{message}</small> : null}
      <div className="wb-assets-google-font-picker__list" aria-label="Google Fonts results">
        {fonts.length === 0 ? (
          <span className="wb-assets-google-font-picker__empty">
            {searching ? 'Searching Google Fonts...' : 'No font families found.'}
          </span>
        ) : fonts.map((font) => (
          <button
            key={font.family}
            type="button"
            className={[
              'wb-assets-google-font-option',
              font.family === selectedFamily ? 'wb-assets-google-font-option--selected' : '',
            ].filter(Boolean).join(' ')}
            aria-pressed={font.family === selectedFamily}
            onClick={() => onSelect(font)}
          >
            <span>
              <strong>{font.family}</strong>
              <small>{formatGoogleFontOptionMeta(font)}</small>
            </span>
            <small>{formatGoogleFontOptionWeights(font)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssetDefaultsPanel({
  defaults,
  fontAssets,
  iconAssets,
  onClearFontDefault,
  onClearIconDefault,
  onSetFontDefault,
  onSetIconDefault,
}: {
  defaults: ReturnType<typeof getWorkbenchAssetDefaults>;
  fontAssets: WorkbenchDesignAsset[];
  iconAssets: WorkbenchDesignAsset[];
  onClearFontDefault: (slot: WorkbenchFontDefaultSlot) => void;
  onClearIconDefault: () => void;
  onSetFontDefault: (slot: WorkbenchFontDefaultSlot, asset: WorkbenchDesignAsset) => void;
  onSetIconDefault: (asset: WorkbenchDesignAsset) => void;
}) {
  return (
    <WorkbenchInspectorSection density="compact" title="Project Default">
      <div className="wb-assets-defaults-panel" aria-label="Project default assets">
        <label>
          <span>Icon set</span>
          <SelectControl
            aria-label="Default icon set"
            value={defaults.iconAssetId ?? ''}
            onValueChange={(assetId) => {
              if (!assetId) {
                onClearIconDefault();
                return;
              }
              const asset = iconAssets.find((candidate) => candidate.id === assetId);
              if (asset) onSetIconDefault(asset);
            }}
          >
            <option value="">No icon set</option>
            {iconAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </SelectControl>
        </label>
        {WORKBENCH_FONT_DEFAULT_SLOTS.map((option) => (
          <label key={option.slot}>
            <span>{option.label}</span>
            <DefaultFontSelect
              assets={fontAssets}
              value={defaults.fonts[option.slot] ?? ''}
              onClear={() => onClearFontDefault(option.slot)}
              onChange={(asset) => onSetFontDefault(option.slot, asset)}
            />
          </label>
        ))}
      </div>
    </WorkbenchInspectorSection>
  );
}

function DefaultFontSelect({
  assets,
  onClear,
  onChange,
  value,
}: {
  assets: WorkbenchDesignAsset[];
  onClear: () => void;
  onChange: (asset: WorkbenchDesignAsset) => void;
  value: string;
}) {
  return (
    <SelectControl
      aria-label="Default font asset"
      value={value}
      onValueChange={(assetId) => {
        if (!assetId) {
          onClear();
          return;
        }
        const asset = assets.find((candidate) => candidate.id === assetId);
        if (asset) onChange(asset);
      }}
    >
      <option value="">No font</option>
      {assets.map((asset) => (
        <option key={asset.id} value={asset.id}>{asset.name}</option>
      ))}
    </SelectControl>
  );
}

function AssetDetail({
  asset,
  defaults,
  onSetCollectionKind,
  onSetFontDefault,
  onSetIconDefault,
  previewZoomed,
}: {
  asset: WorkbenchDesignAsset;
  defaults: ReturnType<typeof getWorkbenchAssetDefaults>;
  onSetCollectionKind: (asset: WorkbenchDesignAsset, collectionKind: AssetCollectionKind) => void;
  onSetFontDefault: (slot: WorkbenchFontDefaultSlot, asset: WorkbenchDesignAsset) => void;
  onSetIconDefault: (asset: WorkbenchDesignAsset) => void;
  previewZoomed: boolean;
}) {
  const effectiveKind = getEffectiveDesignAssetKind(asset);
  return (
    <section className="wb-assets-detail" aria-label={`${asset.name} asset details`}>
      {asset.kind === 'font' ? (
        <FontPreview asset={asset} previewZoomed={previewZoomed} />
      ) : effectiveKind === 'video' ? (
        <VideoPreview asset={asset} previewZoomed={previewZoomed} />
      ) : asset.kind === 'icon' && getIconPreviewSet(asset).length > 0 ? (
        <IconSetPreview asset={asset} previewZoomed={previewZoomed} />
      ) : asset.kind === 'image' && getWorkbenchImagePreviewOptions(asset).length > 0 ? (
        <ImageCollectionPreview asset={asset} previewZoomed={previewZoomed} />
      ) : (
        <ImagePreview asset={asset} previewZoomed={previewZoomed} />
      )}
      <div className="wb-assets-detail__meta">
        <div>
          <p className="wb-kicker">{effectiveKind}</p>
          <h2>{asset.name}</h2>
          <span>{asset.mimeType ?? asset.source.type}{asset.size ? ` · ${formatBytes(asset.size)}` : ''}</span>
        </div>
        <AssetDefaultActions
          asset={asset}
          defaults={defaults}
          onSetFontDefault={onSetFontDefault}
          onSetIconDefault={onSetIconDefault}
        />
      </div>
      <AssetCollectionProperties
        asset={asset}
        onSetCollectionKind={(collectionKind) => onSetCollectionKind(asset, collectionKind)}
      />
      <code className="wb-assets-code">{getDesignAssetUsageValue(asset)}</code>
    </section>
  );
}

function AssetCollectionProperties({
  asset,
  onSetCollectionKind,
}: {
  asset: WorkbenchDesignAsset;
  onSetCollectionKind: (collectionKind: AssetCollectionKind) => void;
}) {
  const collectionKind = getAssetCollectionKind(asset);
  if (!collectionKind) return null;

  const canUseIconKind = canAssetCollectionUseIconKind(asset);
  const sourceRoot = typeof asset.extensions?.sourceAssetRoot === 'string' ? asset.extensions.sourceAssetRoot : '';
  return (
    <div className="wb-assets-properties" aria-label="Asset collection properties">
      <label className="wb-assets-property">
        <span>
          <strong>Collection type</strong>
          <small>{getAssetCollectionSize(asset)} assets</small>
        </span>
        <SelectControl<AssetCollectionKind>
          aria-label="Asset collection type"
          value={collectionKind}
          onValueChange={onSetCollectionKind}
        >
          <option value="image">Image collection</option>
          <option value="icon" disabled={!canUseIconKind}>Icon set</option>
        </SelectControl>
      </label>
      {sourceRoot ? (
        <label className="wb-assets-property">
          <span>
            <strong>Source root</strong>
            <small>Read-only</small>
          </span>
          <TextField aria-label="Asset source root" readOnly value={sourceRoot} />
        </label>
      ) : null}
    </div>
  );
}

function AssetDefaultActions({
  asset,
  defaults,
  onSetFontDefault,
  onSetIconDefault,
}: {
  asset: WorkbenchDesignAsset;
  defaults: ReturnType<typeof getWorkbenchAssetDefaults>;
  onSetFontDefault: (slot: WorkbenchFontDefaultSlot, asset: WorkbenchDesignAsset) => void;
  onSetIconDefault: (asset: WorkbenchDesignAsset) => void;
}) {
  if (asset.kind === 'font') {
    return (
      <div className="wb-assets-default-actions" aria-label="Font defaults">
        {WORKBENCH_FONT_DEFAULT_SLOTS.map((option) => (
          <Button
            key={option.slot}
            className="wb-assets-default-button"
            disabled={defaults.fonts[option.slot] === asset.id}
            onClick={() => onSetFontDefault(option.slot, asset)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  if (asset.kind === 'icon') {
    return (
      <div className="wb-assets-default-actions" aria-label="Icon defaults">
        <Button
          className="wb-assets-default-button"
          disabled={defaults.iconAssetId === asset.id}
          onClick={() => onSetIconDefault(asset)}
        >
          Default icon
        </Button>
      </div>
    );
  }

  return null;
}

function AssetThumb({ asset }: { asset: WorkbenchDesignAsset }) {
  const effectiveKind = getEffectiveDesignAssetKind(asset);
  if (asset.kind === 'font') return <span className="wb-asset-thumb wb-asset-thumb--font"><FileType2 size={14} /></span>;
  if (effectiveKind === 'video') return <span className="wb-asset-thumb wb-asset-thumb--video"><FileVideo size={14} /></span>;
  if (asset.kind === 'icon') return <span className="wb-asset-thumb wb-asset-thumb--icon"><Shapes size={14} /></span>;
  return (
    <span className="wb-asset-thumb wb-asset-thumb--image">
      <FileImage size={14} />
    </span>
  );
}

function VideoPreview({
  asset,
  previewZoomed,
}: {
  asset: WorkbenchDesignAsset;
  previewZoomed: boolean;
}) {
  return (
    <div className={previewZoomed ? 'wb-assets-preview wb-assets-preview--video wb-assets-preview--zoomed' : 'wb-assets-preview wb-assets-preview--video'}>
      <video src={getDesignAssetRuntimeValue(asset)} controls muted playsInline preload="metadata" />
    </div>
  );
}

function ImagePreview({
  asset,
  previewZoomed,
}: {
  asset: WorkbenchDesignAsset;
  previewZoomed: boolean;
}) {
  return (
    <div className={previewZoomed ? 'wb-assets-preview wb-assets-preview--zoomed' : 'wb-assets-preview'}>
      <img src={getDesignAssetRuntimeValue(asset)} alt="" draggable={false} />
    </div>
  );
}

const ASSET_TILE_SIZES = [64, 96, 144, 200, 280];
const ASSET_TILE_DEFAULT_STEP = 1;

function AssetTileZoom({
  step,
  onStepChange,
}: {
  step: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <span className="wb-assets-tile-zoom" role="group" aria-label="Thumbnail size">
      <button
        type="button"
        aria-label="Smaller thumbnails"
        disabled={step === 0}
        onClick={() => onStepChange(Math.max(0, step - 1))}
      >
        <ZoomOut size={12} />
      </button>
      <button
        type="button"
        aria-label="Larger thumbnails"
        disabled={step === ASSET_TILE_SIZES.length - 1}
        onClick={() => onStepChange(Math.min(ASSET_TILE_SIZES.length - 1, step + 1))}
      >
        <ZoomIn size={12} />
      </button>
    </span>
  );
}

function getAssetTileSize(step: number): number {
  return ASSET_TILE_SIZES[step] ?? ASSET_TILE_SIZES[ASSET_TILE_DEFAULT_STEP]!;
}

function ImageCollectionPreview({
  asset,
  previewZoomed,
}: {
  asset: WorkbenchDesignAsset;
  previewZoomed: boolean;
}) {
  const previews = getWorkbenchImagePreviewOptions(asset);
  const [tileStep, setTileStep] = useState(ASSET_TILE_DEFAULT_STEP);
  return (
    <div
      className={previewZoomed ? 'wb-assets-preview wb-assets-preview--icon-set wb-assets-preview--zoomed' : 'wb-assets-preview wb-assets-preview--icon-set'}
      style={{ '--wb-assets-tile-size': `${getAssetTileSize(tileStep)}px` } as CSSProperties}
    >
      <div className="wb-assets-icon-groups">
        <section className="wb-assets-icon-group" aria-label={`${asset.name} images`}>
          <div className="wb-assets-icon-group__header">
            <span>{asset.name}</span>
            <small>{previews.length}</small>
            <AssetTileZoom step={tileStep} onStepChange={setTileStep} />
          </div>
          <div className="wb-assets-image-grid">
            {previews.map((preview) => (
              <figure key={preview.sourceFile ?? preview.value} className="wb-assets-image-tile" title={preview.name}>
                <img src={getWorkbenchAssetRuntimeValue(preview.value)} alt="" draggable={false} />
                <figcaption>{preview.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function IconSetPreview({
  asset,
  previewZoomed,
}: {
  asset: WorkbenchDesignAsset;
  previewZoomed: boolean;
}) {
  const previewGroups = getIconPreviewGroups(asset);
  const [tileStep, setTileStep] = useState(ASSET_TILE_DEFAULT_STEP);
  return (
    <div
      className={previewZoomed ? 'wb-assets-preview wb-assets-preview--icon-set wb-assets-preview--zoomed' : 'wb-assets-preview wb-assets-preview--icon-set'}
      style={{ '--wb-assets-tile-size': `${getAssetTileSize(tileStep)}px` } as CSSProperties}
    >
      <div className="wb-assets-icon-groups">
        {previewGroups.map((group, groupIndex) => (
          <section key={group.key} className="wb-assets-icon-group" aria-label={`${group.label} icons`}>
            <div className="wb-assets-icon-group__header">
              <span>{group.label}</span>
              <small>{group.icons.length}</small>
              {groupIndex === 0 ? <AssetTileZoom step={tileStep} onStepChange={setTileStep} /> : null}
            </div>
            <div className="wb-assets-icon-grid">
              {group.icons.map((icon) => (
                <figure key={`${icon.sourceFile ?? icon.value}:${icon.importName ?? icon.name}`} className="wb-assets-icon-tile" title={formatIconPreviewTitle(icon)}>
                  <img className="wb-icon-preview-image" src={getWorkbenchAssetRuntimeValue(icon.value)} alt="" draggable={false} />
                  <figcaption>{icon.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FontPreview({
  asset,
  previewZoomed,
}: {
  asset: WorkbenchDesignAsset;
  previewZoomed: boolean;
}) {
  const displayFamily = getWorkbenchFontAssetFamily(asset);
  return (
    <div className={previewZoomed ? 'wb-assets-preview wb-assets-preview--font wb-assets-preview--zoomed' : 'wb-assets-preview wb-assets-preview--font'}>
      <style>{getDesignAssetRuntimeCssSnippet(asset)}</style>
      <span style={{ fontFamily: displayFamily }}>{displayFamily} Aa 가나다라마바사</span>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('File could not be read as a data URL'));
    });
    reader.addEventListener('error', () => reject(new Error('File read failed')));
    reader.readAsDataURL(file);
  });
}

async function installProjectAssetFile(
  file: File,
  kindOverride?: WorkbenchDesignAssetKind,
): Promise<WorkbenchDesignAsset> {
  const kind = kindOverride ?? inferDesignAssetKind(file);
  const result = await writeWorkbenchAssetFile({
    dataUrl: await readFileAsDataUrl(file),
    fileName: file.name,
    kind,
  });
  if (!result.ok) throw new Error(result.message);
  return createDesignAssetFromFile({
    file,
    filePath: result.filePath,
    kind,
    publicPath: result.publicPath,
  });
}

async function installProjectImageCollectionAsset(
  files: File[],
  nameDraft: string,
): Promise<WorkbenchDesignAsset> {
  const imageFiles = files.filter(isImageDesignAssetFile);
  if (imageFiles.length === 0) throw new Error('Choose at least one image file for the collection.');

  const now = new Date().toISOString();
  const installedImages = [];
  const setName = nameDraft.trim() || inferImageCollectionName(imageFiles);
  const collectionSlug = createAssetFileSetSlug(setName);
  for (const file of imageFiles) {
    const result = await writeWorkbenchAssetFile({
      collection: collectionSlug,
      dataUrl: await readFileAsDataUrl(file),
      fileName: file.name,
      kind: 'image',
    });
    if (!result.ok) throw new Error(result.message);
    installedImages.push({ file, result });
  }

  const first = installedImages[0]!;
  const baseAsset = createDesignAssetFromFile({
    file: first.file,
    filePath: first.result.filePath,
    kind: 'image',
    now,
    publicPath: first.result.publicPath,
  });

  return {
    ...baseAsset,
    name: setName,
    fileName: `${collectionSlug}.image-set`,
    size: imageFiles.reduce((sum, file) => sum + file.size, 0),
    tags: ['image', 'image-collection'],
    extensions: {
      installedAs: 'manual-image-collection',
      previewImages: installedImages.map(({ file, result }) => ({
        name: formatIconName(file.name),
        sourceFile: file.name,
        value: result.publicPath,
      })),
      sourceAssetRoot: `public/workbench-assets/images/${collectionSlug}`,
    },
  };
}

async function installProjectIconSetAsset(
  files: File[],
  nameDraft: string,
): Promise<WorkbenchDesignAsset> {
  const iconFiles = files.filter(isSvgDesignAssetFile);
  if (iconFiles.length === 0) throw new Error('Choose at least one SVG file for the icon set.');

  const now = new Date().toISOString();
  const installedIcons = [];
  const setName = nameDraft.trim() || inferSvgIconSetName(iconFiles);
  const collectionSlug = createAssetFileSetSlug(setName);
  for (const file of iconFiles) {
    const result = await writeWorkbenchAssetFile({
      collection: collectionSlug,
      dataUrl: await readFileAsDataUrl(file),
      fileName: file.name,
      kind: 'icon',
    });
    if (!result.ok) throw new Error(result.message);
    installedIcons.push({ file, result });
  }

  const first = installedIcons[0]!;
  const baseAsset = createDesignAssetFromFile({
    file: first.file,
    filePath: first.result.filePath,
    kind: 'icon',
    now,
    publicPath: first.result.publicPath,
  });

  return {
    ...baseAsset,
    name: setName,
    fileName: `${collectionSlug}.svg-set`,
    size: iconFiles.reduce((sum, file) => sum + file.size, 0),
    tags: ['icon', 'icon-set'],
    extensions: {
      installedAs: 'manual-svg-icon-set',
      previewIcons: installedIcons.map(({ file, result }) => ({
        importName: createIconImportName(file.name),
        name: formatIconName(file.name),
        sourceFile: getIconSourceFile(result.filePath),
        style: 'custom',
        value: result.publicPath,
      })),
      sourceAssetRoot: `public/workbench-assets/icons/${collectionSlug}`,
    },
  };
}

function isSvgDesignAssetFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

function isRasterImageAssetFile(file: File): boolean {
  if (isSvgDesignAssetFile(file)) return false;
  if (file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(file.name);
}

function isImageDesignAssetFile(file: File): boolean {
  return isSvgDesignAssetFile(file) || isRasterImageAssetFile(file);
}

function inferImageCollectionName(files: File[]): string {
  if (files.length === 1) return formatIconName(files[0]!.name);
  const bases = files.map((file) => stripFileExtension(file.name));
  const prefix = getCommonNamePrefix(bases).replace(/[-_\s]+$/g, '');
  return prefix.length >= 3 ? `${formatIconName(prefix)} Images` : 'Image Collection';
}

function inferSvgIconSetName(files: File[]): string {
  if (files.length === 1) return formatIconName(files[0]!.name);
  const bases = files.map((file) => stripFileExtension(file.name));
  const prefix = getCommonNamePrefix(bases).replace(/[-_\s]+$/g, '');
  return prefix.length >= 3 ? `${formatIconName(prefix)} Icons` : 'SVG Icon Set';
}

function getCommonNamePrefix(values: string[]): string {
  if (values.length === 0) return '';
  let prefix = values[0] ?? '';
  for (const value of values.slice(1)) {
    let index = 0;
    while (index < prefix.length && index < value.length && prefix[index]?.toLowerCase() === value[index]?.toLowerCase()) {
      index += 1;
    }
    prefix = prefix.slice(0, index);
    if (!prefix) break;
  }
  return prefix;
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function formatIconName(fileName: string): string {
  const base = stripFileExtension(fileName)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base ? base.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Icon';
}

function createIconImportName(fileName: string): string {
  const name = stripFileExtension(fileName)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, '');
  return name || 'Icon';
}

function createAssetFileSetSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'svg-icon-set';
}

function getIconSourceFile(filePath: string): string {
  return filePath.replace(/^public\/workbench-assets\/icons\//, '');
}

function getAssetCollectionKind(asset: WorkbenchDesignAsset): AssetCollectionKind | null {
  const iconCount = getWorkbenchIconPreviewOptions(asset).length;
  const imageCount = getWorkbenchImagePreviewOptions(asset).length;
  if (asset.kind === 'icon' && iconCount > 0) return 'icon';
  if (asset.kind === 'image' && imageCount > 0) return 'image';
  if (imageCount > 0) return 'image';
  if (iconCount > 0) return 'icon';
  return null;
}

function getAssetCollectionSize(asset: WorkbenchDesignAsset): number {
  return getAssetCollectionPreviewItems(asset).length;
}

function canAssetCollectionUseIconKind(asset: WorkbenchDesignAsset): boolean {
  const previews = getAssetCollectionPreviewItems(asset);
  return previews.length > 0 && previews.every(isSvgAssetPreviewSource);
}

function convertAssetCollectionKind(
  asset: WorkbenchDesignAsset,
  collectionKind: AssetCollectionKind,
): WorkbenchDesignAsset {
  const previews = getAssetCollectionPreviewItems(asset);
  const now = new Date().toISOString();
  const { installedAs, ...extensions } = asset.extensions ?? {};
  delete extensions.previewIcons;
  delete extensions.previewImages;
  const nextInstalledAs = convertCollectionInstalledAs(installedAs, collectionKind);
  const nextExtensions: Record<string, unknown> = {
    ...extensions,
    ...(nextInstalledAs ? { installedAs: nextInstalledAs } : {}),
  };

  if (collectionKind === 'icon') {
    nextExtensions.previewIcons = previews.map((preview) => ({
      importName: preview.importName ?? createIconImportName(preview.sourceFile ?? preview.name),
      name: preview.name,
      sourceFile: preview.sourceFile,
      style: preview.style ?? 'custom',
      value: preview.value,
    }));
  } else {
    nextExtensions.previewImages = previews.map((preview) => ({
      name: preview.name,
      sourceFile: preview.sourceFile,
      value: preview.value,
    }));
  }

  return {
    ...asset,
    kind: collectionKind,
    fileName: getCollectionFileName(asset.fileName, collectionKind),
    tags: getCollectionTags(asset.tags, collectionKind),
    updatedAt: now,
    extensions: nextExtensions,
  };
}

function getAssetCollectionPreviewItems(asset: WorkbenchDesignAsset): WorkbenchIconPreviewOption[] {
  const iconPreviews = getWorkbenchIconPreviewOptions(asset);
  if (iconPreviews.length > 0) return iconPreviews;
  return getWorkbenchImagePreviewOptions(asset);
}

function isSvgAssetPreviewSource(preview: WorkbenchIconPreviewOption): boolean {
  return isSvgAssetSource(preview.value) || isSvgAssetSource(preview.sourceFile);
}

function isSvgAssetSource(value: string | undefined): boolean {
  const source = value?.trim().split(/[?#]/, 1)[0].toLowerCase() ?? '';
  return source.endsWith('.svg') || source.startsWith('data:image/svg+xml');
}

function convertCollectionInstalledAs(value: unknown, collectionKind: AssetCollectionKind): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  if (collectionKind === 'image' && value === 'manual-svg-icon-set') return 'manual-image-collection';
  if (collectionKind === 'icon' && value === 'manual-image-collection') return 'manual-svg-icon-set';
  return value;
}

function getCollectionFileName(fileName: string | undefined, collectionKind: AssetCollectionKind): string | undefined {
  if (!fileName) return undefined;
  const suffix = collectionKind === 'icon' ? 'svg-set' : 'image-set';
  if (/\.(?:svg-set|image-set)$/i.test(fileName)) {
    return fileName.replace(/\.(?:svg-set|image-set)$/i, `.${suffix}`);
  }
  return `${fileName.replace(/\.[^.]+$/, '')}.${suffix}`;
}

function getCollectionTags(tags: string[], collectionKind: AssetCollectionKind): string[] {
  const removed = new Set(['icon', 'icon-set', 'image', 'image-collection']);
  const collectionTag = collectionKind === 'icon' ? 'icon-set' : 'image-collection';
  return Array.from(new Set([
    collectionKind,
    collectionTag,
    ...tags.filter((tag) => !removed.has(tag)),
  ]));
}

function inferNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split('/').filter(Boolean).pop();
    return fileName?.replace(/\.[^.]+$/, '') || 'Remote asset';
  } catch {
    return 'Remote asset';
  }
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getIconPreviewSet(asset: WorkbenchDesignAsset): WorkbenchIconPreviewOption[] {
  return getWorkbenchIconPreviewOptions(asset);
}

function getIconPreviewGroups(asset: WorkbenchDesignAsset): Array<{
  icons: WorkbenchIconPreviewOption[];
  key: string;
  label: string;
}> {
  const groups = new Map<string, { icons: WorkbenchIconPreviewOption[]; key: string; label: string }>();
  for (const icon of getIconPreviewSet(asset)) {
    const key = icon.styleKey || 'icons';
    const group = groups.get(key) ?? { icons: [], key, label: icon.style || 'Icons' };
    group.icons.push(icon);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function formatIconPreviewTitle(icon: WorkbenchIconPreviewOption): string {
  return [
    icon.name,
    icon.style,
    icon.sourceFile,
  ].filter(Boolean).join(' · ');
}

function parseGoogleFontWeights(value: string): string[] | undefined {
  const weights = value
    .split(/[\s,]+/)
    .map((weight) => weight.trim())
    .filter((weight) => /^[1-9]00$/.test(weight));
  return weights.length > 0 ? Array.from(new Set(weights)) : undefined;
}

function formatGoogleFontWeightsForInstall(font: WorkbenchGoogleFontOption): string {
  const preferred = ['400', '500', '600', '700'].filter((weight) => font.weights.includes(weight));
  const weights = preferred.length > 0 ? preferred : font.weights.slice(0, 4);
  return (weights.length > 0 ? weights : ['400']).join(',');
}

function formatGoogleFontOptionMeta(font: WorkbenchGoogleFontOption): string {
  return [
    font.category,
    font.subsets.slice(0, 3).join(', '),
  ].filter(Boolean).join(' · ') || 'Google Fonts';
}

function formatGoogleFontOptionWeights(font: WorkbenchGoogleFontOption): string {
  const weights = font.weights.length > 0 ? font.weights : ['400'];
  return weights.length > 5 ? `${weights.slice(0, 5).join(', ')}...` : weights.join(', ');
}
