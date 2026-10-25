import { readGtfsImport, type ImportWorkerReply } from '../data/gtfsAnalysis';

self.onmessage = async ({ data }: MessageEvent<File[]>) => {
  let reply: ImportWorkerReply;
  try {
    reply = { ok: true, result: await readGtfsImport(data) };
  } catch {
    reply = { ok: false };
  }
  self.postMessage(reply);
};
