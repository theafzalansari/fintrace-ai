import mongoose, { Schema, Document } from 'mongoose';

export interface IDisbursement extends Document {
  disbursementId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  disbursementDate: Date;
  programCode: string;
  paymentChannel: 'Direct Transfer' | 'UPI' | 'NEFT' | 'RTGS' | 'Check';
  status: 'Completed' | 'Pending' | 'Failed' | 'Reversed';
  referenceNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisbursementSchema: Schema = new Schema<IDisbursement>(
  {
    disbursementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    beneficiaryId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    disbursementDate: {
      type: Date,
      required: true
    },
    programCode: {
      type: String,
      required: true,
      trim: true
    },
    paymentChannel: {
      type: String,
      enum: ['Direct Transfer', 'UPI', 'NEFT', 'RTGS', 'Check'],
      default: 'Direct Transfer'
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Failed', 'Reversed'],
      default: 'Completed'
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Disbursement = mongoose.model<IDisbursement>('Disbursement', DisbursementSchema);
