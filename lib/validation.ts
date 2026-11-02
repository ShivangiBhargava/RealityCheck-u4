import { z } from 'zod'
import { TASK_CATEGORIES } from '@/lib/domain'

export const createTaskSchema = z.object({
  title: z.string().trim().min(8).max(90),
  location: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(180),
  category: z.enum(TASK_CATEGORIES),
  description: z.string().trim().min(20).max(800),
  criteria: z.string().trim().min(10).max(700),
  rewardCents: z.number().int().min(500).max(50_000),
  dueAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) => !value || Number.isFinite(new Date(value).getTime()),
      'Choose a valid deadline.',
    ),
})

export const submissionFieldsSchema = z.object({
  taskId: z.string().uuid(),
  evidence: z.string().trim().min(10).max(800),
  payoutEmail: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
})

export const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
})
