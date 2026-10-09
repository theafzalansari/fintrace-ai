import {
  HealthStatus,
  BeneficiaryRecord,
  DisbursementRecord,
  GraphResponseData,
  RiskAnalysisResponseData,
  IngestionResult,
  CopilotChatResponseData,
  ChatMessage
} from '../types';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error) {
        if (typeof errData.error === 'string') {
          errorMessage = errData.error;
        } else if (errData.error.details) {
          errorMessage = `${errData.error.message}: ${errData.error.details}`;
        } else if (errData.error.message) {
          errorMessage = errData.error.message;
        }
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  /**
   * Health Check API
   */
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthStatus>(res);
  },

  /**
   * Fetch all Beneficiaries
   */
  async getBeneficiaries(): Promise<{ success: boolean; count: number; data: BeneficiaryRecord[] }> {
    const res = await fetch(`${API_BASE_URL}/beneficiaries`);
    return handleResponse<{ success: boolean; count: number; data: BeneficiaryRecord[] }>(res);
  },

  /**
   * Fetch all Disbursements
   */
  async getDisbursements(): Promise<{ success: boolean; count: number; data: DisbursementRecord[] }> {
    const res = await fetch(`${API_BASE_URL}/disbursements`);
    return handleResponse<{ success: boolean; count: number; data: DisbursementRecord[] }>(res);
  },

  /**
   * Fetch Financial Web Graph Analysis
   */
  async getGraphAnalysis(): Promise<{ success: boolean; data: GraphResponseData }> {
    const res = await fetch(`${API_BASE_URL}/analysis/graph`);
    return handleResponse<{ success: boolean; data: GraphResponseData }>(res);
  },

  /**
   * Fetch Explainable Risk Analysis
   */
  async getRiskAnalysis(): Promise<{ success: boolean; data: RiskAnalysisResponseData }> {
    const res = await fetch(`${API_BASE_URL}/analysis/risks`);
    return handleResponse<{ success: boolean; data: RiskAnalysisResponseData }>(res);
  },

  /**
   * Update Human Review Status for a risk finding
   */
  async updateRiskStatus(entityId: string, status: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/analysis/risks/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityId, status })
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  /**
   * Send message to AI Audit Copilot endpoint
   */
  async sendCopilotMessage(
    message: string,
    history: ChatMessage[] = []
  ): Promise<{ success: boolean; data: CopilotChatResponseData }> {
    const res = await fetch(`${API_BASE_URL}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    return handleResponse<{ success: boolean; data: CopilotChatResponseData }>(res);
  },

  /**
   * Upload Beneficiaries CSV (File object or raw CSV text)
   */
  async uploadBeneficiariesCsv(input: File | string): Promise<IngestionResult> {
    if (typeof input === 'string') {
      const res = await fetch(`${API_BASE_URL}/ingest/beneficiaries/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: input
      });
      return handleResponse<IngestionResult>(res);
    } else {
      const formData = new FormData();
      formData.append('file', input);
      const res = await fetch(`${API_BASE_URL}/ingest/beneficiaries/csv`, {
        method: 'POST',
        body: formData
      });
      return handleResponse<IngestionResult>(res);
    }
  },

  /**
   * Upload Disbursements CSV (File object or raw CSV text)
   */
  async uploadDisbursementsCsv(input: File | string): Promise<IngestionResult> {
    if (typeof input === 'string') {
      const res = await fetch(`${API_BASE_URL}/ingest/disbursements/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: input
      });
      return handleResponse<IngestionResult>(res);
    } else {
      const formData = new FormData();
      formData.append('file', input);
      const res = await fetch(`${API_BASE_URL}/ingest/disbursements/csv`, {
        method: 'POST',
        body: formData
      });
      return handleResponse<IngestionResult>(res);
    }
  }
};
