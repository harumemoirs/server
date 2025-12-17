import { pgTable, uuid, text, varchar, timestamp, unique, index, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Schema as per the base web dev package: Kairos

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  resetTokenHash: text("reset_token_hash"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const blogs = pgTable('blogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull().unique(),
  synopsis: text('synopsis').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  imageUrls: text('image_urls').array().default(sql`'{}'::text[]`).notNull(),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  likeCount: numeric('like_count').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull().unique(),
  synopsis: text('synopsis').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  imageUrls: text('image_urls').array().default(sql`'{}'::text[]`).notNull(),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }).notNull(),
  likeCount: numeric('like_count').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const poems = pgTable('poems', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull().unique(),
  synopsis: text('synopsis').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  imageUrls: text('image_urls').array().default(sql`'{}'::text[]`).notNull(),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }).notNull(),
  likeCount: numeric('like_count').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const letters = pgTable('letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull().unique(),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  slug: text('slug').notNull(),
  date: text('date').notNull(),
  imageUrls: text('image_urls').array().default(sql`'{}'::text[]`).notNull(),
  likeCount: numeric('like_count').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  isSubscribed:boolean('isSubscribed').default(true),
  unsubscribedAt: timestamp("unsubscribed_at"),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isVerified: boolean('is_verified').default(false).notNull()
});

 
export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull().unique(),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  sentTo: numeric('sent_to').notNull(), // Shows the total number of users this was sent to
  failedFor: numeric('failed_for').notNull(), // Shows the total failed sending attempts
  sentAt: timestamp('sent_at').defaultNow().notNull()
});

// Likes Tables
export const blogLikes = pgTable('blog_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  blogId: uuid('blog_id')
    .references(() => blogs.id, { onDelete: 'cascade' })
    .notNull(),
  fingerprint: text('fingerprint').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueLike: unique().on(table.blogId, table.fingerprint),
  blogIdx: index('blog_likes_blog_idx').on(table.blogId),
  fingerprintIdx: index('blog_likes_fingerprint_idx').on(table.fingerprint)
}));

export const journalLikes = pgTable('journal_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id')
    .references(() => journals.id, { onDelete: 'cascade' })
    .notNull(),
  fingerprint: text('fingerprint').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueLike: unique().on(table.journalId, table.fingerprint),
  journalIdx: index('journal_likes_journal_idx').on(table.journalId),
  fingerprintIdx: index('journal_likes_fingerprint_idx').on(table.fingerprint)
}));

export const poemLikes = pgTable('poem_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  poemId: uuid('poem_id')
    .references(() => poems.id, { onDelete: 'cascade' })
    .notNull(),
  fingerprint: text('fingerprint').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueLike: unique().on(table.poemId, table.fingerprint),
  poemIdx: index('poem_likes_poem_idx').on(table.poemId),
  fingerprintIdx: index('poem_likes_fingerprint_idx').on(table.fingerprint)
}));

export const letterLikes = pgTable('letter_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  letterId: uuid('letter_id')
    .references(() => letters.id, { onDelete: 'cascade' })
    .notNull(),
  fingerprint: text('fingerprint').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueLike: unique().on(table.letterId, table.fingerprint),
  letterIdx: index('letter_likes_letter_idx').on(table.letterId),
  fingerprintIdx: index('letter_likes_fingerprint_idx').on(table.fingerprint)
}));

// Relations
export const adminRelations = relations(admins, ({ many }) => ({
  blogs: many(blogs),
  journals: many(journals),
  poems: many(poems),
  letters: many(letters),
  newsletters: many(newsletters)
}));

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  admin: one(admins, {
    fields: [blogs.adminId],
    references: [admins.id]
  }),
  likes: many(blogLikes)
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
  admin: one(admins, {
    fields: [journals.adminId],
    references: [admins.id]
  }),
  likes: many(journalLikes)
}));

export const poemsRelations = relations(poems, ({ one, many }) => ({
  admin: one(admins, {
    fields: [poems.adminId],
    references: [admins.id]
  }),
  likes: many(poemLikes)
}));

export const lettersRelations = relations(letters, ({ one, many }) => ({
  admin: one(admins, {
    fields: [letters.adminId],
    references: [admins.id]
  }),
  likes: many(letterLikes)
}));

export const newslettersRelations = relations(newsletters, ({ one }) => ({
  admin: one(admins, {
    fields: [newsletters.adminId],
    references: [admins.id]
  })
}));

export const blogLikesRelations = relations(blogLikes, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogLikes.blogId],
    references: [blogs.id]
  })
}));

export const journalLikesRelations = relations(journalLikes, ({ one }) => ({
  journal: one(journals, {
    fields: [journalLikes.journalId],
    references: [journals.id]
  })
}));

export const poemLikesRelations = relations(poemLikes, ({ one }) => ({
  poem: one(poems, {
    fields: [poemLikes.poemId],
    references: [poems.id]
  })
}));

export const letterLikesRelations = relations(letterLikes, ({ one }) => ({
  letter: one(letters, {
    fields: [letterLikes.letterId],
    references: [letters.id]
  })
}));

// Type Exports
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;

export type Poem = typeof poems.$inferSelect;
export type NewPoem = typeof poems.$inferInsert;

export type Letter = typeof letters.$inferSelect;
export type NewLetter = typeof letters.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

export type Newsletter = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;

export type BlogLike = typeof blogLikes.$inferSelect;
export type NewBlogLike = typeof blogLikes.$inferInsert;

export type JournalLike = typeof journalLikes.$inferSelect;
export type NewJournalLike = typeof journalLikes.$inferInsert;

export type PoemLike = typeof poemLikes.$inferSelect;
export type NewPoemLike = typeof poemLikes.$inferInsert;

export type LetterLike = typeof letterLikes.$inferSelect;
export type NewLetterLike = typeof letterLikes.$inferInsert;