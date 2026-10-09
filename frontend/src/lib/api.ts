import {
  HealthStatus,
  BeneficiaryRecord,
  DisbursementRecord,
  GraphResponseData,
  RiskAnalysisResponseData,
  IngestionResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        errorMessage = errData.error.message;
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
