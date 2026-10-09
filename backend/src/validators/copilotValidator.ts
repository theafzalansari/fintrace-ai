import { z } from 'zod';

export const copilotChatSchema = z.object({
  message: z.string({ required_error: 'message is required' }).trim().min(1, 'message cannot be empty'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().default('')
      })
    )
    .optional()
    .default([])
});

export type CopilotChatInput = z.infer<typeof copilotChatSchema>;

export function validateCopilotChatRequest(body: unknown) {
  return copilotChatSchema.safeParse(body);
}
