import { pgTable, text, timestamp, decimal, uuid, boolean, integer } from 'drizzle-orm/pg-core'

// API Keys
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  key_hash: text('key_hash').notNull().unique(), // Never store plain key
  name: text('name'),
  user_id: uuid('user_id').references(() => users.id),
  daily_limit_usd: decimal('daily_limit_usd', { precision: 10, scale: 4 }).notNull().default('10.0000'),
  task_limit_usd: decimal('task_limit_usd', { precision: 10, scale: 4 }),
  total_limit_usd: decimal('total_limit_usd', { precision: 10, scale: 4 }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  last_used_at: timestamp('last_used_at'),
})

// Users (optional, for dashboard)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  wallet_address: text('wallet_address').unique(),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

// Usage records (metadata only, never content)
export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  api_key_id: uuid('api_key_id').references(() => apiKeys.id).notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  privacy_tier: text('privacy_tier').notNull(),
  prompt_tokens: integer('prompt_tokens').notNull(),
  completion_tokens: integer('completion_tokens').notNull(),
  cost_usd: decimal('cost_usd', { precision: 10, scale: 6 }).notNull(),
  latency_ms: integer('latency_ms'),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

// Daily budget tracking
export const dailyBudgets = pgTable('daily_budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  api_key_id: uuid('api_key_id').references(() => apiKeys.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  spent_usd: decimal('spent_usd', { precision: 10, scale: 6 }).notNull().default('0'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})

// x402 Payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  api_key_id: uuid('api_key_id').references(() => apiKeys.id),
  payer_address: text('payer_address').notNull(),
  amount_usd: decimal('amount_usd', { precision: 10, scale: 6 }).notNull(),
  tx_hash: text('tx_hash'),
  status: text('status').notNull().default('pending'), // pending, settled, failed
  usage_record_id: uuid('usage_record_id').references(() => usageRecords.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
  settled_at: timestamp('settled_at'),
})
