import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Server } from 'http';
import { createApp } from '../app.js';
import { ingestionService } from '../services/ingestion/ingestionService.js';

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

  it('POST /api/copilot/chat - should respond with audit summary grounding when query is general', async () => {
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          beneficiaryId: 'BEN-COPILOT-1',
          name: 'Copilot Test User 1',
          bankAccountNumber: '999988887777',
          ifscOrRoutingCode: 'SBIN0001234'
        }
      ])
    });

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

  it('POST /api/copilot/chat - should answer questions grounded in specific beneficiary risk signals', async () => {
    // Ingest 2 beneficiaries sharing 1 bank account
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          beneficiaryId: 'BEN-FLAG-1',
          name: 'Flagged Ben 1',
          bankAccountNumber: 'SHARED-ACC-777',
          ifscOrRoutingCode: 'ICIC0001234'
        },
        {
          beneficiaryId: 'BEN-FLAG-2',
          name: 'Flagged Ben 2',
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
    assert.ok(body.data.answer.includes('BEN-FLAG-1') || body.data.citedRecords.includes('BEN-FLAG-1'));
  });
});
