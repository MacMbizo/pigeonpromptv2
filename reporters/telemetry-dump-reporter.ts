import type { Reporter, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';

class TelemetryDumpReporter implements Reporter {
  private failed = false;

  onTestEnd(_test: TestCase, result: TestResult) {
    if (result.status !== 'passed') this.failed = true;
  }

  async onEnd(result: FullResult) {
    const status = result.status || 'passed';
    if (!this.failed && status === 'passed') return;
    const url = process.env.APP_URL || 'http://localhost:3100';
    const outDir = process.env.PLAYWRIGHT_ARTIFACTS_DIR || 'test-results';
    const outPath = path.join(outDir, 'telemetry-buffer.json');
    try {
      const res = await fetch(url + '/api/dev/telemetry', { headers: { accept: 'application/json' } });
      const json = await res.json();
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify({ fetchedAt: new Date().toISOString(), ...json }, null, 2), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`[telemetry-reporter] dumped telemetry buffer to ${outPath}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[telemetry-reporter] failed to fetch telemetry buffer:', (e as any)?.message);
    }
  }
}

export default TelemetryDumpReporter;