import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Server } from 'http';
import { createApp } from '../app.js';
import { caseService } from '../services/cases/caseService.js';

let server: Server;
let baseUrl: string;

describe('Persistent Investigation Cases & PDF Evidence Dossier API', () => {
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

  it('1. GET /api/cases - should list investigation cases', async () => {
    const res = await fetch(`${baseUrl}/cases`);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('2. POST /api/cases - should create a persistent investigation case', async () => {
    const payload = {
      entityId: 'BEN-TEST-999',
      entityType: 'beneficiary',
      title: 'Test Investigation: Flagged Shell Syndicate',
      riskScore: 85,
      riskSeverity: 'HIGH',
      riskSignals: [
        { ruleId: 'SHARED_PAYOUT_ACCOUNT', severity: 'HIGH', points: 50, description: 'Shares bank account with 2 other entities' }
      ],
      explanations: ['Shares bank account ACC-SHARED-99 with BEN-3004']
    };

    const res = await fetch(`${baseUrl}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.ok(body.data.caseId.startsWith('CASE-'));
    assert.strictEqual(body.data.entityId, 'BEN-TEST-999');
    assert.strictEqual(body.data.status, 'OPEN');
    assert.strictEqual(body.data.priority, 'HIGH');
    assert.ok(body.data.auditLog.length > 0);
  });

  it('3. PATCH /api/cases/:id - should update case status and record audit entry', async () => {
    // Create case first
    const created = await caseService.createCase({ entityId: 'BEN-PATCH-101', priority: 'MEDIUM', riskScore: 50 });

    const updateRes = await fetch(`${baseUrl}/cases/${created.caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'UNDER_REVIEW', priority: 'HIGH', reason: 'Assigned to forensic team' })
    });

    assert.strictEqual(updateRes.status, 200);
    const body = (await updateRes.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'UNDER_REVIEW');
    assert.strictEqual(body.data.priority, 'HIGH');
    assert.ok(body.data.statusHistory.some((h: any) => h.toStatus === 'UNDER_REVIEW'));
  });

  it('4. POST /api/cases/:id/notes - should append timestamped investigator note', async () => {
    const created = await caseService.createCase({ entityId: 'BEN-NOTE-202', riskScore: 75 });

    const noteRes = await fetch(`${baseUrl}/cases/${created.caseId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Verified bank account statement matches shared syndicate pattern.', author: 'Audit Lead' })
    });

    assert.strictEqual(noteRes.status, 200);
    const body = (await noteRes.json()) as any;
    assert.strictEqual(body.success, true);
    assert.ok(body.data.notes.some((n: any) => n.content.includes('shared syndicate pattern')));
  });

  it('5. GET /api/reports/cases/:id/pdf - should stream PDF evidence dossier with application/pdf header', async () => {
    const created = await caseService.createCase({
      entityId: 'BEN-PDF-303',
      title: 'PDF Dossier Test Case',
      riskScore: 90,
      riskSeverity: 'HIGH'
    });

    const pdfRes = await fetch(`${baseUrl}/reports/cases/${created.caseId}/pdf`);
    assert.strictEqual(pdfRes.status, 200);
    assert.strictEqual(pdfRes.headers.get('content-type'), 'application/pdf');

    const pdfBuffer = await pdfRes.arrayBuffer();
    assert.ok(pdfBuffer.byteLength > 500);

    // Verify PDF header magic bytes %PDF-
    const headerStr = Buffer.from(pdfBuffer).toString('utf8', 0, 5);
    assert.strictEqual(headerStr, '%PDF-');
  });

  it('6. Validation & 404 Error Handling - should return 404 for non-existent case ID', async () => {
    const res = await fetch(`${baseUrl}/cases/CASE-NONEXISTENT-99999`);
    assert.strictEqual(res.status, 404);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, false);

    const pdfRes = await fetch(`${baseUrl}/reports/cases/CASE-NONEXISTENT-99999/pdf`);
    assert.strictEqual(pdfRes.status, 404);
  });
});
