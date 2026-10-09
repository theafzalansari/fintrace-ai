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
    // Ingest beneficiary first as required
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          beneficiaryId: 'BEN-TEST-1',
          name: 'Test Beneficiary',
          bankAccountNumber: '998877665544',
          ifscOrRoutingCode: 'SBIN0009999'
        }
      ])
    });

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
    // Ingest beneficiary first as required
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          beneficiaryId: 'BEN-VAR-1',
          name: 'Header Variation Test',
          bankAccountNumber: '990088776655',
          ifscOrRoutingCode: 'SBIN0005555'
        }
      ])
    });

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

  it('POST /api/ingest/disbursements/csv - should reject row referencing missing beneficiary and return 400', async () => {
    const csvData = `disbursement_id,beneficiary_id,amount,currency,disbursement_date,program_code
DISB-MISSING-1,BEN-NONEXISTENT-999,50000,INR,2024-03-25,SCHEME-AGRI`;

    const res = await fetch(`${baseUrl}/ingest/disbursements/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvData
    });

    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.summary.acceptedCount, 0);
    assert.strictEqual(body.summary.rejectedCount, 1);
    assert.ok(body.rejected[0].errors[0].message.includes('does not exist'));
  });

  it('Demo CSV Ingestion Flow - beneficiaries_demo.csv and disbursements_demo_v2.csv', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const benCsv = fs.readFileSync(path.join(process.cwd(), 'src/data/demo-upload/beneficiaries_demo.csv'), 'utf-8');
    const disbCsv = fs.readFileSync(path.join(process.cwd(), 'src/data/demo-upload/disbursements_demo_v2.csv'), 'utf-8');

    // 1. Upload Beneficiaries CSV
    const resBen = await fetch(`${baseUrl}/ingest/beneficiaries/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: benCsv
    });
    assert.strictEqual(resBen.status, 200);
    const bodyBen = (await resBen.json()) as any;
    assert.strictEqual(bodyBen.summary.acceptedCount, 10);
    assert.strictEqual(bodyBen.summary.rejectedCount, 0);

    // 2. Upload Disbursements CSV
    const resDisb = await fetch(`${baseUrl}/ingest/disbursements/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: disbCsv
    });
    assert.strictEqual(resDisb.status, 200);
    const bodyDisb = (await resDisb.json()) as any;
    assert.strictEqual(bodyDisb.summary.acceptedCount, 20);
    assert.strictEqual(bodyDisb.summary.rejectedCount, 0);
  });

  it('Regression Test - exact disbursements_demo_v2 (2).csv header row with BOM and program_code alias', async () => {
    // Ingest beneficiary first
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { beneficiaryId: 'BEN-3001', name: 'Aarav Sharma', bankAccountNumber: '918273645001', ifscOrRoutingCode: 'SBIN0001234' }
      ])
    });

    // Exact header row from disbursements_demo_v2 (2).csv with UTF-8 BOM
    const csvWithBom = `\uFEFFdisbursementId,beneficiaryId,amount,currency,disbursementDate,programCode,paymentChannel,status,referenceNumber,remarks
DISB-REG-1,BEN-3001,25000.00,INR,2024-03-01T10:00:00.000Z,SCHEME-AGRI-2024,Direct Transfer,Completed,REF-981001,Farmer grant`;

    const res = await fetch(`${baseUrl}/ingest/disbursements/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvWithBom
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.summary.acceptedCount, 1);
  });

  it('Regression Test - header present but row 0 has empty programCode value defaults to GENERAL-PROGRAM', async () => {
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { beneficiaryId: 'BEN-3001', name: 'Aarav Sharma', bankAccountNumber: '918273645001', ifscOrRoutingCode: 'SBIN0001234' }
      ])
    });

    // programCode header exists, but row 0 has empty string "" value
    const csvData = `disbursementId,beneficiaryId,amount,currency,disbursementDate,programCode
DISB-EMPTY-VAL,BEN-3001,10000,INR,2024-03-01,`;

    const res = await fetch(`${baseUrl}/ingest/disbursements/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvData
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.summary.acceptedCount, 1);
    assert.strictEqual(body.accepted[0].programCode, 'GENERAL-PROGRAM');
  });

  it('Regression Test - CSV without programCode header defaults programCode to GENERAL-PROGRAM', async () => {
    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { beneficiaryId: 'BEN-3001', name: 'Aarav Sharma', bankAccountNumber: '918273645001', ifscOrRoutingCode: 'SBIN0001234' }
      ])
    });

    const csvWithoutProgramCode = `disbursementId,beneficiaryId,amount,currency,disbursementDate,paymentMethod,transactionReference
DISB-NO-PROG,BEN-3001,10000,INR,2024-03-01,Direct Transfer,REF-998877`;

    const res = await fetch(`${baseUrl}/ingest/disbursements/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvWithoutProgramCode
    });

    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.summary.acceptedCount, 1);
    assert.strictEqual(body.accepted[0].programCode, 'GENERAL-PROGRAM');
    assert.strictEqual(body.accepted[0].paymentChannel, 'Direct Transfer');
    assert.strictEqual(body.accepted[0].referenceNumber, 'REF-998877');
  });
});

