import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, FileText, RefreshCw, FileUp } from 'lucide-react';
import { api } from '../../lib/api';
import { IngestionResult } from '../../types';
import { Button } from './Button';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'beneficiary' | 'disbursement';
  onSuccess: () => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File | undefined | null): boolean => {
    if (!selectedFile) return false;

    const fileName = selectedFile.name.toLowerCase();
    const isCsvExtension = fileName.endsWith('.csv');
    const isCsvMimeType = selectedFile.type === 'text/csv' || 
                          selectedFile.type === 'application/vnd.ms-excel' || 
                          selectedFile.type === 'text/plain';

    if (!isCsvExtension && !isCsvMimeType) {
      setError('Invalid file format. Please select a valid .csv file.');
      setFile(null);
      return false;
    }

    if (selectedFile.size === 0) {
      setError('The selected CSV file is empty (0 bytes). Please choose a file containing data.');
      setFile(null);
      return false;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a valid CSV file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let res: IngestionResult;
      if (type === 'beneficiary') {
        res = await api.uploadBeneficiariesCsv(file);
      } else {
        res = await api.uploadDisbursementsCsv(file);
      }
      setResult(res);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sample CSV datasets matching backend synthetic data
      let sampleCsv = '';
      if (type === 'beneficiary') {
        sampleCsv = `beneficiaryId,name,bankAccountNumber,ifscOrRoutingCode,category,phone,email,address,identityHash,status
BEN-1001,Rajesh Kumar,918273645012,SBIN0001234,Individual,+919876543210,rajesh.k@example.com,"12 Civil Lines, New Delhi",HASH-BEN-1001,Active
BEN-1002,Asha Workers Co-Op,918273645012,HDFC0005678,NGO,+919876543211,contact@ashacoop.org,"45 NGO Complex, Jaipur",HASH-BEN-1002,Active
BEN-1003,Apex Infrastructure Ltd,789654123089,ICIC0009999,Contractor,+919876543212,info@apexinfra.com,"Sector 62, Noida",HASH-BEN-1003,Active
BEN-1004,Sunita Devi,102938475601,PUNB0004321,Individual,,sunita@example.com,"Village Rampur, Bihar",HASH-BEN-1004,Active
BEN-1005,,123,INVALID_IFSC,Unknown,,invalid-email-address,,HASH-BEN-1005,Active`;
      } else {
        sampleCsv = `disbursementId,beneficiaryId,amount,currency,disbursementDate,programCode,paymentChannel,status,referenceNumber,remarks
DISB-2024-001,BEN-1001,25000.00,INR,2024-03-01T10:00:00.000Z,SCHEME-AGRI-2024,Direct Transfer,Completed,REF-981237,Direct benefit transfer for seed subsidy
DISB-2024-002,BEN-1002,150000.00,INR,2024-03-02T11:30:00.000Z,SCHEME-HEALTH-2024,NEFT,Completed,REF-981238,Community health equipment grant
DISB-2024-003,BEN-1003,450000.00,INR,2024-03-03T14:15:00.000Z,SCHEME-INFRA-2024,RTGS,Completed,REF-981239,Milestone 1 road construction payment
DISB-2024-004,BEN-1004,5000.00,INR,2024-03-04T09:45:00.000Z,SCHEME-AGRI-2024,UPI,Completed,REF-981240,Emergency relief fund
DISB-2024-005,BEN-1005,-500.00,INR,invalid-date,,Unknown,Completed,REF-981241,Invalid payment entry test`;
      }

      let res: IngestionResult;
      if (type === 'beneficiary') {
        res = await api.uploadBeneficiariesCsv(sampleCsv);
      } else {
        res = await api.uploadDisbursementsCsv(sampleCsv);
      }
      setResult(res);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sample ingestion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetModal = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white capitalize">
                Ingest {type} CSV Dataset
              </h3>
              <p className="text-xs text-slate-400">
                Upload CSV file for live validation and storage.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload & Dropzone Area */}
        <div className="space-y-4">
          <div
            onClick={triggerFileBrowse}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-800 hover:border-blue-500/50 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <FileUp className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <FileText className="w-8 h-8 text-slate-500" />
            )}
            <div className="text-sm text-slate-300">
              {file ? (
                <span className="font-medium text-emerald-400">
                  {file.name} ({Math.round(file.size / 1024) || 1} KB)
                </span>
              ) : (
                <span>
                  Drag & drop a <span className="text-blue-400 font-semibold">.csv</span> file here, or click to browse
                </span>
              )}
            </div>
            <Button
              variant={file ? 'secondary' : 'outline'}
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileBrowse();
              }}
              className="mt-1"
            >
              {file ? 'Change File' : 'Browse Files'}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Don't have a dataset ready?</span>
            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Load Synthetic Demo Data
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ingestion Results Summary */}
        {result && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-sm font-semibold text-white">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Ingestion Completed
              </span>
              <span className="text-xs font-mono text-slate-400">
                Total Rows: {result.summary.totalRows}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="block text-lg font-bold">{result.summary.acceptedCount}</span>
                <span>Accepted Records</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <span className="block text-lg font-bold">{result.summary.rejectedCount}</span>
                <span>Rejected Rows</span>
              </div>
            </div>

            {result.rejected && result.rejected.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-mono font-semibold text-amber-400">
                  Validation Error Details ({result.rejected.length} rows failed):
                </p>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {result.rejected.map((rej, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
                      <div className="text-slate-300 font-semibold">Row {rej.row}:</div>
                      {rej.errors.map((err, errIdx) => (
                        <div key={errIdx} className="text-amber-400 pl-2">
                          • [{err.field}]: {err.message}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleResetModal();
              onClose();
            }}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Upload & Process'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
