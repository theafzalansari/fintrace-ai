import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { ingestionService } from '../ingestion/ingestionService.js';
import { graphService } from '../graph-analysis/graphService.js';
import { riskService, RISK_DISCLAIMER } from '../risk-scoring/riskService.js';
import { logger } from '../../utils/logger.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChatResponse {
  answer: string;
  citedRecords: string[];
  provider: 'gemini-ai' | 'rule-engine-fallback';
  disclaimer: string;
}

export class CopilotService {
  private mockGenerateContentFn?: (params: any) => Promise<{ text?: string }>;

  /**
   * Allows setting a mock generator function for automated unit tests.
   */
  public setMockGenerator(fn?: (params: any) => Promise<{ text?: string }>): void {
    this.mockGenerateContentFn = fn;
  }

  /**
   * Processes an incoming audit copilot chat message and returns a grounded response.
   */
  public async chat(message: string, history: ChatMessage[] = []): Promise<CopilotChatResponse> {
    // 1. Gather live audit telemetry
    const [rawBeneficiaries, rawDisbursements, graphData, riskData] = await Promise.all([
      ingestionService.getBeneficiaries() as Promise<any[]>,
      ingestionService.getDisbursements() as Promise<any[]>,
      graphService.buildGraph(),
      riskService.calculateRisks()
    ]);

    const contextSummary = {
      beneficiaryCount: rawBeneficiaries.length,
      disbursementCount: rawDisbursements.length,
      totalGraphNodes: graphData.summary.totalNodes,
      totalGraphEdges: graphData.summary.totalEdges,
      highRiskCount: riskData.summary.highRiskCount,
      mediumRiskCount: riskData.summary.mediumRiskCount,
      lowRiskCount: riskData.summary.lowRiskCount
    };

    const citedRecordsSet = new Set<string>();
    const apiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
    const modelName = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    // 2. Invoke Gemini if API key is provided or mock function is active
    if (this.mockGenerateContentFn || (apiKey && apiKey !== '' && apiKey !== 'your_gemini_api_key_here')) {
      try {
        const systemPrompt = `You are FinTrace AI Audit Copilot, an expert AI financial forensic assistant built for micro-audits, entity resolution, and ghost-beneficiary detection.

ABOUT FINTRACE AI PLATFORM:
FinTrace AI is an advanced financial forensic micro-audit workspace engineered to detect ghost beneficiaries, duplicate payout accounts, and anomalous disbursement patterns across public and enterprise welfare programs. Its core modules include:
- Beneficiary & Disbursement Ledgers (CSV/JSON ingestion with automatic IFSC/routing code validation)
- Hybrid Risk Engine (6-signal explainable risk rules combined with an in-house Isolation Forest ML anomaly detector)
- Financial Web Graph Explorer (relational node/edge network visualizing shared accounts and suspicious clusters)
- Persistent Investigation Case Management & PDF Evidence Dossiers
- Grounded AI Audit Copilot

LIVE AUDIT DATASET TELEMETRY:
- Summary: ${JSON.stringify(contextSummary)}
- Beneficiaries (${rawBeneficiaries.length}): ${JSON.stringify(
          rawBeneficiaries.slice(0, 30).map((b) => ({
            id: b.beneficiaryId,
            name: b.name,
            account: b.bankAccountNumber,
            ifsc: b.ifscOrRoutingCode,
            category: b.category,
            status: b.status
          }))
        )}
- Disbursements (${rawDisbursements.length}): ${JSON.stringify(
          rawDisbursements.slice(0, 40).map((d) => ({
            id: d.disbursementId,
            benId: d.beneficiaryId,
            amount: d.amount,
            channel: d.paymentChannel,
            status: d.status,
            date: d.disbursementDate
          }))
        )}
- Shared Attribute Graph Edges: ${JSON.stringify(
          graphData.edges.slice(0, 50).map((e) => ({
            source: e.source,
            target: e.target,
            relation: e.relation,
            reason: e.reason,
            attribute: e.sourceAttribute
          }))
        )}
- Risk Findings & Evidence Signals: ${JSON.stringify(
          riskData.findings.slice(0, 30).map((f) => ({
            id: f.entityId,
            name: f.name,
            score: f.riskScore,
            level: f.riskLevel,
            signals: f.signals
          }))
        )}

FORENSIC AUDIT RULES:
1. Ground your answers strictly in the provided Live Audit Dataset Telemetry and Platform Information.
2. If asked about the platform or "Tell me about the platform", describe FinTrace AI accurately using the platform information provided above.
3. Distinguish verified database facts (e.g., matching account numbers, exact disbursement amounts) from audit interpretations.
4. Always cite specific record IDs (e.g., BEN-1001, DISB-2024-001, ACC-918273645012) when discussing findings or beneficiaries.
5. When explaining why a record is flagged, describe the supporting risk signals, suggest appropriate human-review steps (e.g., physical address verification, phone confirmation, bank branch verification), and explicitly state that a risk flag is NOT proof of fraud.
6. If evidence or records requested by the user are unavailable in the dataset, state clearly that it is not found rather than inventing an answer.
7. Keep answers concise, clear, and professional. Use markdown formatting with bullet points and bold record IDs.`;

        let resultText = '';

        if (this.mockGenerateContentFn) {
          const res = await this.mockGenerateContentFn({
            model: modelName,
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...history.map((h) => ({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content }]
              })),
              { role: 'user', parts: [{ text: message }] }
            ]
          });
          resultText = res.text || 'No response generated.';
        } else {
          const ai = new GoogleGenAI({ apiKey });

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Gemini API call timed out after 12 seconds')), 12000);
          });

          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...history.map((h) => ({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content }]
              })),
              { role: 'user', parts: [{ text: message }] }
            ],
            config: {
              maxOutputTokens: 1024,
              temperature: 0.2
            }
          });

          const response = await Promise.race([generatePromise, timeoutPromise]);
          resultText = response.text || 'No response generated.';
        }

        // Extract cited IDs from answer
        for (const b of rawBeneficiaries) {
          if (b.beneficiaryId && resultText.includes(b.beneficiaryId)) {
            citedRecordsSet.add(b.beneficiaryId);
          }
        }
        for (const d of rawDisbursements) {
          if (d.disbursementId && resultText.includes(d.disbursementId)) {
            citedRecordsSet.add(d.disbursementId);
          }
        }

        return {
          answer: resultText,
          citedRecords: Array.from(citedRecordsSet),
          provider: 'gemini-ai',
          disclaimer: RISK_DISCLAIMER
        };
      } catch (err) {
        logger.warn(
          'Gemini API call failed or timed out, switching to Rule Engine Fallback:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    // Grounded Audit Rule Engine Fallback (when API key is missing or offline)
    const fallbackAnswer = this.generateGroundedFallbackResponse(
      message,
      rawBeneficiaries,
      rawDisbursements,
      graphData,
      riskData,
      citedRecordsSet
    );

    return {
      answer: fallbackAnswer,
      citedRecords: Array.from(citedRecordsSet),
      provider: 'rule-engine-fallback',
      disclaimer: RISK_DISCLAIMER
    };
  }

  /**
   * Deterministic grounded fallback response generator when AI provider key is not set.
   */
  private generateGroundedFallbackResponse(
    query: string,
    beneficiaries: any[],
    disbursements: any[],
    graphData: any,
    riskData: any,
    citedRecordsSet: Set<string>
  ): string {
    const q = query.toLowerCase();

    // 1. General platform description questions (works even when workspace is empty)
    if (
      q.includes('platform') ||
      q.includes('fintrace') ||
      q.includes('what is this') ||
      q.includes('about the platform') ||
      q.includes('tell me about') ||
      q.includes('how does this work')
    ) {
      let resp = `### About **FinTrace AI** Micro-Audit Platform\n\n`;
      resp += `**FinTrace AI** is an advanced financial forensic micro-audit workspace engineered to detect ghost beneficiaries, duplicate payout accounts, and anomalous disbursement patterns across public and enterprise welfare programs.\n\n`;
      resp += `#### Core Capabilities:\n`;
      resp += `• **Beneficiary & Disbursement Ledgers**: File upload & JSON ingestion with automatic IFSC/routing code validation.\n`;
      resp += `• **Hybrid Risk Engine**: Combines 6 explainable risk rules (shared accounts, threshold spikes) with an in-house Isolation Forest ML anomaly detector.\n`;
      resp += `• **Financial Web Graph Explorer**: Interactive node/edge graph visualizing shared attribute relationships across beneficiaries and accounts.\n`;
      resp += `• **Persistent Case Management**: Formal investigation workflows with auditor notes and downloadable PDF evidence dossiers.\n`;
      resp += `• **AI Audit Copilot**: Grounded forensic assistant for real-time risk inquiry and entity resolution.\n\n`;
      resp += `*Workspace Telemetry*: Currently tracking **${beneficiaries.length}** ingested beneficiaries and **${disbursements.length}** disbursement records.`;
      return resp;
    }

    if (beneficiaries.length === 0 && disbursements.length === 0) {
      return `### FinTrace AI Audit Assistant

The audit workspace is currently empty. No beneficiary or disbursement records have been imported yet.

To begin forensic micro-auditing:
1. Upload a **Beneficiary CSV file** via the **Beneficiary Ledger** or **Audit Dashboard**.
2. Upload a **Disbursement CSV file** to analyze payout volumes and execution dates.

Once data is ingested, I can explain risk flags, trace shared-account clusters, and answer specific inquiry questions.`;
    }

    // Check if query targets a specific beneficiary ID
    const matchedBen = beneficiaries.find(
      (b) => b.beneficiaryId && q.includes(b.beneficiaryId.toLowerCase())
    );

    if (matchedBen) {
      citedRecordsSet.add(matchedBen.beneficiaryId);
      const finding = riskData.findings.find((f: any) => f.entityId === matchedBen.beneficiaryId);
      const benDisbs = disbursements.filter((d: any) => d.beneficiaryId === matchedBen.beneficiaryId);
      const sharedEdges = graphData.edges.filter(
        (e: any) => e.source === matchedBen.beneficiaryId || e.target === matchedBen.beneficiaryId
      );

      let resp = `### Audit Analysis for **${matchedBen.name}** (${matchedBen.beneficiaryId})\n\n`;
      resp += `- **Status**: ${matchedBen.status || 'Active'}\n`;
      resp += `- **Bank Account**: \`${matchedBen.bankAccountNumber}\` (IFSC: ${matchedBen.ifscOrRoutingCode})\n`;
      resp += `- **Category**: ${matchedBen.category}\n`;

      if (finding) {
        resp += `- **Risk Assessment**: **${finding.riskLevel} RISK** (Score: **${finding.riskScore}/100**)\n\n`;
        if (finding.signals.length > 0) {
          resp += `#### Contributing Evidence & Signals:\n`;
          finding.signals.forEach((sig: any) => {
            resp += `• **[+${sig.points} PTS]** \`${sig.ruleId}\`: ${sig.description}\n`;
          });
        } else {
          resp += `• No risk signals triggered for this beneficiary.\n`;
        }
      }

      if (sharedEdges.length > 0) {
        resp += `\n#### Graph Relationships (${sharedEdges.length}):\n`;
        sharedEdges.forEach((e: any) => {
          resp += `• **${e.relation}**: ${e.reason} (source attribute: \`${e.sourceAttribute}\`)\n`;
          if (e.source && e.source !== matchedBen.beneficiaryId) citedRecordsSet.add(e.source);
          if (e.target && e.target !== matchedBen.beneficiaryId) citedRecordsSet.add(e.target);
        });
      }

      if (benDisbs.length > 0) {
        resp += `\n#### Linked Disbursements (${benDisbs.length}):\n`;
        benDisbs.forEach((d: any) => {
          citedRecordsSet.add(d.disbursementId);
          resp += `• **${d.disbursementId}**: ₹${Number(d.amount).toLocaleString('en-IN')} via ${d.paymentChannel} (${d.status})\n`;
        });
      }

      return resp;
    }

    // Check shared-account or cluster query
    if (q.includes('shared') || q.includes('account') || q.includes('ghost') || q.includes('relationship')) {
      const sharedEdges = graphData.edges.filter((e: any) => e.relation.startsWith('SHARED_'));
      if (sharedEdges.length === 0) {
        return `### Shared Account & Relationship Analysis\n\nNo shared-account clusters or shared attribute edges were detected in the current audit dataset of **${beneficiaries.length}** beneficiaries. All registered payout accounts appear to be single-owner destinations.`;
      }

      let resp = `### Shared Account & Relational Clusters Detected\n\nIdentified **${sharedEdges.length}** shared attribute relationships across the financial web graph:\n\n`;
      sharedEdges.forEach((e: any) => {
        if (e.source) citedRecordsSet.add(e.source);
        if (e.target) citedRecordsSet.add(e.target);
        resp += `• **${e.relation}**: ${e.reason} (Attribute: \`${e.sourceAttribute}\`)\n`;
      });
      return resp;
    }

    // General Audit Summary Query
    if (q.includes('summary') || q.includes('findings') || q.includes('overview') || q.includes('audit')) {
      let resp = `### FinTrace AI Micro-Audit Summary\n\n`;
      resp += `• **Total Ingested Beneficiaries**: **${beneficiaries.length}**\n`;
      resp += `• **Total Disbursements**: **${disbursements.length}**\n`;
      resp += `• **High Risk Flags**: **${riskData.summary.highRiskCount}**\n`;
      resp += `• **Medium Risk Flags**: **${riskData.summary.mediumRiskCount}**\n`;
      resp += `• **Low Risk Flags**: **${riskData.summary.lowRiskCount}**\n\n`;

      if (riskData.findings.length > 0) {
        resp += `#### Top Risk Findings Requiring Review:\n`;
        riskData.findings.slice(0, 3).forEach((f: any) => {
          citedRecordsSet.add(f.entityId);
          resp += `• **${f.name}** (\`${f.entityId}\`) — **${f.riskLevel} RISK (${f.riskScore}/100)**: ${f.explanations[0] || 'Flagged'}\n`;
        });
      }

      return resp;
    }

    // Default response for other queries
    let resp = `### FinTrace AI Audit Assistant\n\n`;
    resp += `I have analyzed the current audit telemetry containing **${beneficiaries.length}** beneficiaries and **${disbursements.length}** disbursements.\n\n`;
    resp += `You can ask me specific questions such as:\n`;
    resp += `1. *"Why was BEN-1001 flagged?"*\n`;
    resp += `2. *"Are there shared-account relationships between beneficiaries?"*\n`;
    resp += `3. *"Which records support this risk finding?"*\n`;
    resp += `4. *"Summarize the current audit findings."*`;
    return resp;
  }
}

export const copilotService = new CopilotService();
