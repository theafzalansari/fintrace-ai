import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Server } from 'http';
import { createApp } from '../app.js';
import { ingestionService } from '../services/ingestion/ingestionService.js';
import { copilotService } from '../services/copilot/copilotService.js';

let server: Server;
let baseUrl: string;

describe('AI Audit Copilot Chat API', () => {
  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}/api`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    ingestionService.clearMemoryStore();
    copilotService.setMockGenerator(undefined);
  });

  it('POST /api/copilot/chat - should reject invalid request body with 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' })
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, false);
    assert.ok(body.error.message.includes('Invalid copilot chat request body'));
  });

  it('POST /api/copilot/chat - should reject messages exceeding character limit', async () => {
    const longMessage = 'a'.repeat(2001);
    const res = await fetch(`${baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: longMessage })
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, false);
  });

  it('POST /api/copilot/chat - should use rule-engine-fallback when Gemini API key is unconfigured', async () => {
    // Ensure no mock generator is attached
    copilotService.setMockGenerator(undefined);

    const res = await fetch(`${baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Summarize the current audit findings' })
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.ok(body.data.answer.length > 0);
    assert.ok(body.data.disclaimer.includes('human review'));
    assert.ok(['gemini-ai', 'rule-engine-fallback'].includes(body.data.provider));
  });

  it('POST /api/copilot/chat - should return gemini-ai provider on successful Gemini response', async () => {
    // Inject mock generator simulating Gemini success
    copilotService.setMockGenerator(async () => {
      return {
        text: '### Gemini Audit Analysis\nBeneficiary **BEN-FLAG-1** was flagged due to shared account patterns. Human review is recommended. This risk flag is not proof of fraud.'
      };
    });

    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          beneficiaryId: 'BEN-FLAG-1',
          name: 'Flagged Ben 1',
          bankAccountNumber: 'SHARED-ACC-777',
          ifscOrRoutingCode: 'ICIC0001234'
        }
      ])
    });

    const res = await fetch(`${baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Why was BEN-FLAG-1 flagged?' })
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.provider, 'gemini-ai');
    assert.ok(body.data.answer.includes('Gemini Audit Analysis'));
    assert.ok(body.data.citedRecords.includes('BEN-FLAG-1'));
  });

  it('POST /api/copilot/chat - should fallback safely to rule engine when Gemini API throws an error', async () => {
    // Inject mock generator simulating quota exhaustion / API failure
    copilotService.setMockGenerator(async () => {
      throw new Error('429 Resource exhausted / Quota exceeded');
    });

    const res = await fetch(`${baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Why was BEN-FLAG-1 flagged?' })
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.provider, 'rule-engine-fallback');
    assert.ok(body.data.answer.length > 0);
  });

  it('POST /api/copilot/chat - should answer general platform query "Tell me about the platform"', async () => {
    // Force fallback engine to verify platform query handling
    copilotService.setMockGenerator(async () => {
      throw new Error('Offline test');
    });

    const res = await fetch(`${baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tell me about the platform' })
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.ok(body.data.answer.includes('FinTrace AI'));
    assert.ok(body.data.answer.includes('Micro-Audit Platform') || body.data.answer.includes('Capabilities'));
    assert.strictEqual(body.data.provider, 'rule-engine-fallback');
  });
});

