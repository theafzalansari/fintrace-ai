import { z } from 'zod';

export const copilotChatSchema = z.object({
  message: z
    .string({ required_error: 'message is required' })
    .trim()
    .min(1, 'message cannot be empty')
    .max(2000, 'message cannot exceed 2000 characters'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().default('').transform((val) => val.slice(0, 2000))
      })
    )
    .optional()
    .default([])
    .transform((historyArr) => historyArr.slice(-10))
});

export type CopilotChatInput = z.infer<typeof copilotChatSchema>;

export function validateCopilotChatRequest(body: unknown) {
  return copilotChatSchema.safeParse(body);
}
