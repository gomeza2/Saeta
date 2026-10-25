import { afterEach, describe, expect, it, vi } from 'vitest';
import { startGtfsImport } from './gtfsImport';
import { readGtfsImport } from './gtfsAnalysis';
import { scheduleFiles } from '../test/gtfsScheduleFixture';

afterEach(() => vi.unstubAllGlobals());
describe('import background processing', () => {
  it('retains schedule maps in analyzed results', async () => {
    const files = Object.entries(scheduleFiles).map(
      ([name, text]) => ({ name, text: () => Promise.resolve(text) }) as File,
    );
    const result = await readGtfsImport(files);
    expect(result.data.schedule?.exceptions.get('svc')?.get('20261025')).toBe('1');
    expect(result.data.routes).toHaveLength(2);
  });
  it('terminates a worker when cancelled and ignores late completion', async () => {
    const instance: {
      terminate: ReturnType<typeof vi.fn>;
      onmessage: ((event: MessageEvent) => void) | null;
      onerror: (() => void) | null;
      postMessage: ReturnType<typeof vi.fn>;
    } = { terminate: vi.fn(), onmessage: null, onerror: null, postMessage: vi.fn() };
    class FakeWorker {
      constructor() {
        return instance;
      }
    }
    vi.stubGlobal('Worker', FakeWorker);
    const task = startGtfsImport([]);
    const rejected = expect(task.promise).rejects.toThrow('Cancelled');
    task.cancel();
    expect(instance.terminate).toHaveBeenCalledOnce();
    instance.onmessage?.({ data: { ok: true, result: {} } } as MessageEvent);
    await rejected;
  });
  it('rejects a failed worker rather than returning incomplete results', async () => {
    let fail!: () => void;
    class FailedWorker {
      terminate = vi.fn();
      postMessage = vi.fn();
      onmessage = null;
      set onerror(handler: () => void) {
        fail = handler;
      }
    }
    vi.stubGlobal('Worker', FailedWorker);
    const task = startGtfsImport([]);
    fail();
    await expect(task.promise).rejects.toThrow('Import worker failed');
  });
});
