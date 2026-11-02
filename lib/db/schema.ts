import type { EvidenceReview } from '@/lib/domain'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  location: text('location').notNull(),
  address: text('address').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  criteria: text('criteria').notNull(),
  rewardCents: integer('rewardCents').notNull(),
  status: text('status').notNull().default('open'),
  dueAt: timestamp('dueAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const submissions = pgTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    taskId: text('taskId').notNull(),
    userId: text('userId').notNull(),
    evidence: text('evidence').notNull(),
    evidencePathname: text('evidencePathname').notNull(),
    payoutEmail: text('payoutEmail').notNull(),
    aiReview: jsonb('aiReview').$type<EvidenceReview>().notNull(),
    aiModel: text('aiModel').notNull(),
    status: text('status').notNull().default('pending_review'),
    reviewedAt: timestamp('reviewedAt'),
    payoutBatchId: text('payoutBatchId'),
    payoutStatus: text('payoutStatus'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    paidAt: timestamp('paidAt'),
  },
  (table) => ({
    taskUserUnique: uniqueIndex('submissions_taskId_userId_key').on(
      table.taskId,
      table.userId,
    ),
    payoutBatchUnique: uniqueIndex('submissions_payoutBatchId_key').on(
      table.payoutBatchId,
    ),
  }),
)
