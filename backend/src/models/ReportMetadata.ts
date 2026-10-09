import mongoose, { Schema, Document } from 'mongoose';

export interface IReportMetadata extends Document {
  reportId: string;
  caseId?: string;
  reportType: 'CASE_DOSSIER' | 'EXECUTIVE_AUDIT_CSV' | 'GRAPH_TELEMETRY';
  title: string;
  generatedBy: string;
  fileSize: number;
  checksum: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const ReportMetadataSchema: Schema = new Schema<IReportMetadata>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    caseId: {
      type: String,
      index: true,
      trim: true
    },
    reportType: {
      type: String,
      enum: ['CASE_DOSSIER', 'EXECUTIVE_AUDIT_CSV', 'GRAPH_TELEMETRY'],
      default: 'CASE_DOSSIER'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    generatedBy: {
      type: String,
      default: 'Lead Audit Investigator'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    checksum: {
      type: String,
      default: ''
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const ReportMetadata = mongoose.model<IReportMetadata>('ReportMetadata', ReportMetadataSchema);
