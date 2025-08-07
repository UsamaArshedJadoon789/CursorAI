import OpenAI from 'openai';
import { Page } from '@playwright/test';

export type AiAssertionResult = {
  passed: boolean;
  verdict: 'pass' | 'fail' | 'skip';
  reason: string;
};

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

async function capturePageContext(page: Page): Promise<string> {
  const url = page.url();
  const title = await page.title();
  const headings = await page.locator('h1, h2, [role="heading"]').allInnerTexts();
  const buttons = await page.getByRole('button').allInnerTexts();
  const links = await page.getByRole('link').allInnerTexts();
  const bodyText = await page.locator('body').innerText();

  const normalizedBody = bodyText.replace(/\s+/g, ' ').trim().slice(0, 6000);

  return [
    `URL: ${url}`,
    `Title: ${title}`,
    `Headings: ${JSON.stringify(headings).slice(0, 1500)}`,
    `Buttons: ${JSON.stringify(buttons).slice(0, 1500)}`,
    `Links: ${JSON.stringify(links).slice(0, 1500)}`,
    `Body: ${normalizedBody}`,
  ].join('\n');
}

export async function aiAssertPage(page: Page, rubric: string, options?: { model?: string; temperature?: number }): Promise<AiAssertionResult> {
  const client = getClient();
  if (!client) {
    return { passed: true, verdict: 'skip', reason: 'OPENAI_API_KEY not set; AI assertion skipped.' };
  }

  const model = options?.model || 'gpt-4o-mini';
  const temperature = options?.temperature ?? 0.0;
  const context = await capturePageContext(page);

  const system = `You are a strict QA validator. You are given a rubric and a snapshot of a web page (text only). Decide PASS/FAIL. You must be conservative and explain briefly. Output strictly in JSON with keys: passed (boolean), reason (string).`;
  const user = `Rubric:\n${rubric}\n\nPage Snapshot:\n${context}`;

  const response = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';
  let parsed: { passed?: boolean; reason?: string } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { passed: false, reason: 'Invalid JSON from AI' };
  }

  const passed = !!parsed.passed;
  const reason = parsed.reason || 'No reason provided';
  return { passed, verdict: passed ? 'pass' : 'fail', reason };
}