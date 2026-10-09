import { z } from 'zod';

export const beneficiaryInputSchema = z.object({
  beneficiaryId: z.string({ required_error: 'beneficiaryId is required' }).trim().min(1, 'beneficiaryId cannot be empty'),
  name: z.string({ required_error: 'name is required' }).trim().min(1, 'name cannot be empty'),
  bankAccountNumber: z.string({ required_error: 'bankAccountNumber is required' }).trim().min(4, 'bankAccountNumber must be at least 4 characters'),
  ifscOrRoutingCode: z.string({ required_error: 'ifscOrRoutingCode is required' }).trim().min(3, 'ifscOrRoutingCode must be at least 3 characters'),
  category: z.enum(['Individual', 'Vendor', 'NGO', 'Contractor']).catch('Individual').default('Individual'),
  phone: z.string().optional().default(''),
  email: z.string().optional().refine(
    (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Invalid email format' }
  ).default(''),
  address: z.string().optional().default(''),
  identityHash: z.string().optional().default(''),
  status: z.enum(['Active', 'Suspended', 'Flagged']).catch('Active').default('Active')
});

export type BeneficiaryInput = z.infer<typeof beneficiaryInputSchema>;

export function validateBeneficiaryRecord(rawRecord: unknown) {
  return beneficiaryInputSchema.safeParse(rawRecord);
}
