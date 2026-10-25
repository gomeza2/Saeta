import { validateGtfsFiles, type GtfsValidationReport } from './gtfs';
import { buildGtfsPreview, parseGtfsTables, type GtfsPreviewData } from './gtfsPreview';

export interface ImportResult {
  report: GtfsValidationReport;
  data: GtfsPreviewData;
}
export type ImportWorkerReply = { ok: true; result: ImportResult } | { ok: false };

export async function readGtfsImport(selected: File[]): Promise<ImportResult> {
  const files: Record<string, string> = {};
  // Sequential reads avoid retaining a second array of all raw file strings.
  for (const file of selected) files[file.name] = await file.text();
  const tables = parseGtfsTables(files);
  return { report: validateGtfsFiles(files, tables), data: buildGtfsPreview(files, tables) };
}
