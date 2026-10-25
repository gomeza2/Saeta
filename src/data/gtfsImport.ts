import { readGtfsImport, type ImportResult, type ImportWorkerReply } from './gtfsAnalysis';

export function startGtfsImport(files: File[]): {
  promise: Promise<ImportResult>;
  cancel: () => void;
} {
  if (typeof Worker === 'undefined') {
    let cancelled = false;
    return {
      promise: readGtfsImport(files).then((result) => {
        if (cancelled) throw new Error('Cancelled');
        return result;
      }),
      cancel: () => {
        cancelled = true;
      },
    };
  }
  const worker = new Worker(new URL('../workers/gtfs.worker.ts', import.meta.url), {
    type: 'module',
  });
  let cancel = () => worker.terminate();
  const promise = new Promise<ImportResult>((resolve, reject) => {
    cancel = () => {
      worker.terminate();
      reject(new Error('Cancelled'));
    };
    worker.onmessage = ({ data }: MessageEvent<ImportWorkerReply>) => {
      worker.terminate();
      if (data.ok) resolve(data.result);
      else reject(new Error('Import failed'));
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Import worker failed'));
    };
    worker.postMessage(files);
  });
  return { promise, cancel };
}
