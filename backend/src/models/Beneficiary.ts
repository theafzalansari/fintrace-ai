import mongoose, { Schema, Document } from 'mongoose';

export interface IBeneficiary extends Document {
  beneficiaryId: string;
  name: string;
  bankAccountNumber: string;
  ifscOrRoutingCode: string;
  category: 'Individual' | 'Vendor' | 'NGO' | 'Contractor';
  phone?: string;
  email?: string;
  address?: string;
  identityHash?: string;
  status: 'Active' | 'Suspended' | 'Flagged';
  createdAt: Date;
  updatedAt: Date;
}

const BeneficiarySchema: Schema = new Schema<IBeneficiary>(
  {
    beneficiaryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    bankAccountNumber: {
      type: String,
      required: true,
      trim: true
    },
    ifscOrRoutingCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      enum: ['Individual', 'Vendor', 'NGO', 'Contractor'],
      default: 'Individual'
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    identityHash: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Flagged'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

export const Beneficiary = mongoose.model<IBeneficiary>('Beneficiary', BeneficiarySchema);
