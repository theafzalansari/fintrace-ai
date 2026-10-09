import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Server } from 'http';
import { createApp } from '../app.js';
import { ingestionService } from '../services/ingestion/ingestionService.js';

let server: Server;
let baseUrl: string;

describe('Graph Construction & Explainable Risk Scoring API', () => {
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

  it('1. Empty Dataset - should safely handle empty dataset for graph and risk endpoints', async () => {
    // GET Graph
    const graphRes = await fetch(`${baseUrl}/analysis/graph`);
    assert.strictEqual(graphRes.status, 200);
    const graphBody = (await graphRes.json()) as any;
    assert.strictEqual(graphBody.success, true);
    assert.strictEqual(graphBody.data.nodes.length, 0);
    assert.strictEqual(graphBody.data.edges.length, 0);
    assert.strictEqual(graphBody.data.summary.totalNodes, 0);

    // GET Risks
    const riskRes = await fetch(`${baseUrl}/analysis/risks`);
    assert.strictEqual(riskRes.status, 200);
    const riskBody = (await riskRes.json()) as any;
    assert.strictEqual(riskBody.success, true);
    assert.strictEqual(riskBody.data.findings.length, 0);
    assert.strictEqual(riskBody.data.summary.totalEntitiesAssessed, 0);
  });

  it('2. Legitimate Unrelated Beneficiaries - should produce low risk scores and clean graph without shared links', async () => {
    const payload = [
      {
        beneficiaryId: 'BEN-LEGIT-1',
        name: 'Ramesh Shah',
        bankAccountNumber: '100000000001',
        ifscOrRoutingCode: 'SBIN0001111',
        phone: '+919100000001',
        email: 'ramesh@example.com',
        address: '10 Street A, Mumbai'
      },
      {
        beneficiaryId: 'BEN-LEGIT-2',
        name: 'Suresh Patel',
        bankAccountNumber: '200000000002',
        ifscOrRoutingCode: 'HDFC0002222',
        phone: '+919200000002',
        email: 'suresh@example.com',
        address: '20 Street B, Ahmedabad'
      }
    ];

    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Check Graph
    const graphRes = await fetch(`${baseUrl}/analysis/graph`);
    const graphBody = (await graphRes.json()) as any;
    assert.strictEqual(graphBody.data.summary.beneficiaryCount, 2);
    assert.strictEqual(graphBody.data.summary.payoutAccountCount, 2);

    // Verify no SHARED_* edges exist between legitimate unrelated beneficiaries
    const sharedEdges = graphBody.data.edges.filter((e: any) => e.relation.startsWith('SHARED_'));
    assert.strictEqual(sharedEdges.length, 0);

    // Check Risks
    const riskRes = await fetch(`${baseUrl}/analysis/risks`);
    const riskBody = (await riskRes.json()) as any;
    assert.strictEqual(riskBody.data.findings.length, 2);

    for (const finding of riskBody.data.findings) {
      assert.strictEqual(finding.riskLevel, 'LOW');
      assert.ok(finding.riskScore >= 0 && finding.riskScore <= 100);
      assert.strictEqual(finding.signals.length, 0);
      assert.ok(finding.disclaimer.includes('human review'));
    }
  });

  it('3. Suspicious Shared-Account Cluster - should construct shared edges, high risk score, and explainable signals', async () => {
    // 3 beneficiaries sharing 1 bank account + 1 duplicate identity hash
    const beneficiariesPayload = [
      {
        beneficiaryId: 'BEN-CLUSTER-1',
        name: 'Ghost Beneficiary 1',
        bankAccountNumber: 'SHARED-ACC-999',
        ifscOrRoutingCode: 'ICIC0009999',
        phone: '+919999900001',
        identityHash: 'HASH-GHOST-CLUSTER'
      },
      {
        beneficiaryId: 'BEN-CLUSTER-2',
        name: 'Ghost Beneficiary 2',
        bankAccountNumber: 'SHARED-ACC-999',
        ifscOrRoutingCode: 'ICIC0009999',
        phone: '+919999900002',
        identityHash: 'HASH-GHOST-CLUSTER'
      },
      {
        beneficiaryId: 'BEN-CLUSTER-3',
        name: 'Ghost Beneficiary 3',
        bankAccountNumber: 'SHARED-ACC-999',
        ifscOrRoutingCode: 'ICIC0009999',
        phone: '+919999900003'
      }
    ];

    const disbursementsPayload = [
      {
        disbursementId: 'DISB-C-1',
        beneficiaryId: 'BEN-CLUSTER-1',
        amount: 300000,
        currency: 'INR',
        disbursementDate: '2024-03-01',
        programCode: 'SCHEME-AGRI'
      },
      {
        disbursementId: 'DISB-C-2',
        beneficiaryId: 'BEN-CLUSTER-1',
        amount: 300000,
        currency: 'INR',
        disbursementDate: '2024-03-02',
        programCode: 'SCHEME-AGRI'
      }
    ];

    await fetch(`${baseUrl}/ingest/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beneficiariesPayload)
    });

    await fetch(`${baseUrl}/ingest/disbursements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(disbursementsPayload)
    });

    // 1. Verify Graph Analysis
    const graphRes = await fetch(`${baseUrl}/analysis/graph`);
    assert.strictEqual(graphRes.status, 200);
    const graphData = (await graphRes.json()) as any;

    const nodes = graphData.data.nodes;
    const edges = graphData.data.edges;

    // Check payout account node
    const payoutNode = nodes.find((n: any) => n.id === 'ACC-SHARED-ACC-999');
    assert.ok(payoutNode);
    assert.strictEqual(payoutNode.metadata.associatedBeneficiariesCount, 3);

    // Check shared bank account edges
    const sharedAccountEdges = edges.filter((e: any) => e.relation === 'SHARED_BANK_ACCOUNT');
    assert.ok(sharedAccountEdges.length > 0);

    for (const edge of sharedAccountEdges) {
      assert.strictEqual(edge.sourceAttribute, 'bankAccountNumber');
      assert.ok(edge.reason.length > 0);
    }

    // 2. Verify Risk Scoring
    const riskRes = await fetch(`${baseUrl}/analysis/risks`);
    assert.strictEqual(riskRes.status, 200);
    const riskData = (await riskRes.json()) as any;

    const findings = riskData.data.findings;
    assert.strictEqual(findings.length, 3);

    // Verify findings ranking (highest score first)
    for (let i = 0; i < findings.length - 1; i++) {
      assert.ok(findings[i].riskScore >= findings[i + 1].riskScore);
    }

    // Verify top finding has HIGH risk score clamped between 0 and 100
    const topFinding = findings[0];
    assert.ok(topFinding.riskScore >= 70 && topFinding.riskScore <= 100);
    assert.strictEqual(topFinding.riskLevel, 'HIGH');

    // Check explanation signals
    const sharedAccountSignal = topFinding.signals.find((s: any) => s.ruleId === 'SHARED_PAYOUT_ACCOUNT');
    assert.ok(sharedAccountSignal);
    assert.strictEqual(sharedAccountSignal.severity, 'HIGH');
    assert.ok(topFinding.explanations.some((exp: string) => exp.includes('SHARED-ACC-999')));
  });
});
