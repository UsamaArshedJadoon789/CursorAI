import { Page, test, expect } from '@playwright/test';
import { analyze } from '@axe-core/playwright';

export type A11ySeverity = 'minor' | 'moderate' | 'serious' | 'critical';

export async function runA11yScan(page: Page, options?: { include?: string[]; exclude?: string[]; failOn?: A11ySeverity }) {
  const results = await analyze(page, {
    detailedReport: false,
    detailedReportOptions: { html: false },
    include: options?.include?.map((s) => [s]),
    exclude: options?.exclude?.map((s) => [s]),
  } as any);

  const failOn: A11ySeverity = options?.failOn || 'serious';
  const severities: A11ySeverity[] = ['minor', 'moderate', 'serious', 'critical'];

  const violations = results.violations.filter(v => severities.indexOf((v.impact as A11ySeverity) || 'minor') >= severities.indexOf(failOn));

  const summary = violations.map(v => `${v.id} (${v.impact}): ${v.help} — nodes: ${v.nodes.length}`).join('\n');
  test.info().annotations.push({ type: 'a11y', description: summary || 'No serious/critical violations' });

  expect.soft(violations, `Accessibility issues (>= ${failOn}):\n${summary}`).toHaveLength(0);
}