import { z } from 'zod';

export const disbursementInputSchema = z.object({
  disbursementId: z.string({ required_error: 'disbursementId is required' }).trim().min(1, 'disbursementId cannot be empty'),
  beneficiaryId: z.string({ required_error: 'beneficiaryId is required' }).trim().min(1, 'beneficiaryId cannot be empty'),
  amount: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number({ required_error: 'amount is required and must be a number' }).positive('amount must be a positive number greater than 0')
  ),
  currency: z.string().optional().default('INR'),
  disbursementDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === 'string' || typeof val === 'number') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? val : d;
      }
      return val;
    },
    z.date({ required_error: 'disbursementDate is required and must be a valid date' })
  ),
  programCode: z.string({ required_error: 'programCode is required' }).trim().min(1, 'programCode cannot be empty'),
  paymentChannel: z.enum(['Direct Transfer', 'UPI', 'NEFT', 'RTGS', 'Check']).catch('Direct Transfer').default('Direct Transfer'),
  status: z.enum(['Completed', 'Pending', 'Failed', 'Reversed']).catch('Completed').default('Completed'),
  referenceNumber: z.string().optional().default(''),
  remarks: z.string().optional().default('')
});

export type DisbursementInput = z.infer<typeof disbursementInputSchema>;

export function validateDisbursementRecord(rawRecord: unknown) {
  return disbursementInputSchema.safeParse(rawRecord);
}
