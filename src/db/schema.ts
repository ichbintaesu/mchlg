import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const cells = pgTable('cells', {
  id: text('id').primaryKey(),
  roughName: text('rough_name'),
  centerLat: doublePrecision('center_lat'),
  centerLng: doublePrecision('center_lng'),
  status: text('status').notNull().default('active'),
  sensitive: boolean('sensitive').notNull().default(false),
  postCount: integer('post_count').notNull().default(0),
  visiblePostCount: integer('visible_post_count').notNull().default(0),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const posts = pgTable(
  'posts',
  {
    id: text('id').primaryKey(),
    cellId: text('cell_id')
      .notNull()
      .references(() => cells.id),
    content: text('content').notNull(),
    language: text('language'),
    status: text('status').notNull().default('visible'),
    reportCount: integer('report_count').notNull().default(0),
    reactionCount: integer('reaction_count').notNull().default(0),
    deviceHash: text('device_hash'),
    ipHash: text('ip_hash'),
    ipEnc: text('ip_enc'),
    ipEncExpiresAt: timestamp('ip_enc_expires_at', { withTimezone: true }),
    moderationScore: integer('moderation_score').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('posts_cell_created_idx').on(t.cellId, t.createdAt.desc()),
    index('posts_status_created_idx').on(t.status, t.createdAt.desc()),
    index('posts_device_idx').on(t.deviceHash),
  ],
)

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id),
    reason: text('reason').notNull(),
    detail: text('detail'),
    status: text('status').notNull().default('open'),
    deviceHash: text('device_hash'),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reports_post_idx').on(t.postId),
    uniqueIndex('reports_post_device_uq').on(t.postId, t.deviceHash),
  ],
)

export const postReactions = pgTable(
  'post_reactions',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id),
    deviceHash: text('device_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('post_reactions_post_device_uq').on(t.postId, t.deviceHash)],
)

export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  deviceHash: text('device_hash').unique().notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }),
  blockedUntil: timestamp('blocked_until', { withTimezone: true }),
  trustScore: integer('trust_score').notNull().default(0),
})

export const adminActions = pgTable('admin_actions', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull(),
  actionType: text('action_type').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const moderationRules = pgTable('moderation_rules', {
  id: text('id').primaryKey(),
  ruleType: text('rule_type').notNull(),
  pattern: text('pattern').notNull(),
  note: text('note'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    cellId: text('cell_id'),
    deviceHash: text('device_hash'),
    source: text('source'),
    uiLocale: text('ui_locale'),
    deviceLanguage: text('device_language'),
    os: text('os'),
    browser: text('browser'),
    deviceType: text('device_type'),
    country: text('country'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_type_created_idx').on(t.eventType, t.createdAt.desc()),
    index('events_cell_idx').on(t.cellId),
  ],
)
