import type { WorkbenchInspectorTokenPickerFilters } from '@domain/project/workbenchInspectorSession';
import type { WorkbenchPreviewTokenModeSelection } from '@domain/project/workbenchPreviewSession';

export type PreviewTokenModeSelection = WorkbenchPreviewTokenModeSelection;
export type InspectorTokenPickerFilters = WorkbenchInspectorTokenPickerFilters;
export type SpecNoteHistoryChange = {
  kind?: 'create' | 'delete' | 'move' | 'patch' | 'structural';
  label: string;
  mergeKey?: string;
  mergeSessionId?: string;
};
