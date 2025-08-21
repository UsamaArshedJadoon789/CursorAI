import { Page, test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type A11ySeverity = 'minor' | 'moderate' | 'serious' | 'critical';

export async function runA11yScan(page: Page, options?: { include?: string[]; exclude?: string[]; failOn?: A11ySeverity }) {
  const results = await new AxeBuilder({ page })
    .disableRules([])
    .include((options?.include || []).map((s) => [s]) as any)
    .exclude((options?.exclude || []).map((s) => [s]) as any)
    .analyze();

  const failOn: A11ySeverity = options?.failOn || 'serious';
  const severities: A11ySeverity[] = ['minor', 'moderate', 'serious', 'critical'];

  const violations = results.violations.filter((v: any) => severities.indexOf((v.impact as A11ySeverity) || 'minor') >= severities.indexOf(failOn));

  const summary = violations.map((v: any) => `${v.id} (${v.impact}): ${v.help} — nodes: ${v.nodes.length}`).join('\n');
  test.info().annotations.push({ type: 'a11y', description: summary || 'No serious/critical violations' });

  expect.soft(violations, `Accessibility issues (>= ${failOn}):\n${summary}`).toHaveLength(0);
}