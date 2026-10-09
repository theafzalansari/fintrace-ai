import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Server } from 'http';
import { createApp } from '../app.js';
import { ingestionService } from '../services/ingestion/ingestionService.js';

let server: Server;
let baseUrl: string;

describe('Ingestion & Record API Endpoints', () => {
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

  it('GET /api/health - should return 200 OK and health status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'FinTrace AI Backend');
  });

  it('POST /api/ingest/beneficiaries - should process JSON records and report accepted/rejected summary', async () => {
    const payload = [
      {
        beneficiaryId: 'BEN-TEST-1',
        name: 'Valid Beneficiary',
        bankAccountNumber: '998877665544',
        ifscOrRoutingCode: 'SBIN0009999',
        category: 'Individual'
      },
      {
        beneficiaryId: '',
        name: '',
        bankAccountNumber: '123',
        ifscOrRoutingCode: ''
      }
    ];

    const res = await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.summary.totalRows, 2);
    assert.strictEqual(body.summary.acceptedCount, 1);
    assert.strictEqual(body.summary.rejectedCount, 1);
    assert.strictEqual(body.rejected[0].row, 2);
    assert.ok(body.rejected[0].errors.length > 0);
  });

  it('POST /api/ingest/disbursements - should process JSON records and report summary', async () => {
    const payload = [
      {
        disbursementId: 'DISB-TEST-1',
        beneficiaryId: 'BEN-TEST-1',
        amount: 12500,
        currency: 'INR',
        disbursementDate: '2024-03-20',
        programCode: 'SCHEME-TEST'
      }
    ];

    const res = await fetch(`${baseUrl}/ingest/disbursements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.summary.acceptedCount, 1);
  });

  it('POST /api/ingest/beneficiaries/csv - should parse raw CSV content', async () => {
    const csvData = `beneficiaryId,name,bankAccountNumber,ifscOrRoutingCode,category
BEN-CSV-1,CSV User,112233445566,HDFC0001111,Vendor
BEN-CSV-2,,123,INVALID,`;

    const res = await fetch(`${baseUrl}/ingest/beneficiaries/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvData
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.summary.totalRows, 2);
    assert.strictEqual(body.summary.acceptedCount, 1);
    assert.strictEqual(body.summary.rejectedCount, 1);
  });

  it('GET /api/beneficiaries & GET /api/disbursements - should retrieve ingested records', async () => {
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          beneficiaryId: 'BEN-GET-1',
          name: 'Get User',
          bankAccountNumber: '1234567890',
          ifscOrRoutingCode: 'ICIC0001234'
        }
      ])
    });

    const resBen = await fetch(`${baseUrl}/beneficiaries`);
    assert.strictEqual(resBen.status, 200);
    const bodyBen = (await resBen.json()) as any;
    assert.strictEqual(bodyBen.count, 1);
    assert.strictEqual(bodyBen.data[0].beneficiaryId, 'BEN-GET-1');
  });

  it('POST /api/ingest/beneficiaries - should handle duplicate uploads idempotently', async () => {
    const singlePayload = [
      {
        beneficiaryId: 'BEN-DUP-1',
        name: 'Original Name',
        bankAccountNumber: '111122223333',
        ifscOrRoutingCode: 'SBIN0001111'
      }
    ];

    const duplicatePayload = [
      {
        beneficiaryId: 'BEN-DUP-1',
        name: 'Updated Name',
        bankAccountNumber: '111122223333',
        ifscOrRoutingCode: 'SBIN0001111'
      }
    ];

    // First upload
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(singlePayload)
    });

    // Duplicate upload with updated field
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload)
    });

    // Verify database/store has 1 record with updated values (no duplicate documents)
    const res = await fetch(`${baseUrl}/beneficiaries`);
    const body = (await res.json()) as any;
    assert.strictEqual(body.count, 1);
    assert.strictEqual(body.data[0].beneficiaryId, 'BEN-DUP-1');
    assert.strictEqual(body.data[0].name, 'Updated Name');
  });

  it('POST /api/ingest/beneficiaries/csv - header variations (ifsc, ifscCode, ifsc_code, BOM)', async () => {
    const csvData = `\uFEFFbeneficiary_id,beneficiary_name,account_number,ifsc_code,category
BEN-VAR-1,Header Variation Test,990088776655,SBIN0005555,Individual`;

    const res = await fetch(`${baseUrl}/ingest/beneficiaries/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvData
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.summary.acceptedCount, 1);
    assert.strictEqual(body.accepted[0].beneficiaryId, 'BEN-VAR-1');
    assert.strictEqual(body.accepted[0].ifscOrRoutingCode, 'SBIN0005555');
  });

  it('POST /api/ingest/beneficiaries/csv - missing required header returns 400 error', async () => {
    const csvData = `wrong_col_1,wrong_col_2,wrong_col_3
val1,val2,val3`;

    const res = await fetch(`${baseUrl}/ingest/beneficiaries/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvData
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, false);
    assert.ok(body.error.details.includes('missing required beneficiary headers'));
  });

  it('POST /api/ingest/disbursements/csv - process disbursement CSV', async () => {
    const csvData = `disbursement_id,beneficiary_id,amount,currency,disbursement_date,program_code
DISB-CSV-100,BEN-VAR-1,50000,INR,2024-03-25,SCHEME-AGRI`;

    const res = await fetch(`${baseUrl}/ingest/disbursements/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvData
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.summary.acceptedCount, 1);
    assert.strictEqual(body.accepted[0].disbursementId, 'DISB-CSV-100');
  });
});

