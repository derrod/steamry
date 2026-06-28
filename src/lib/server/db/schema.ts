import { relations, sql } from 'drizzle-orm';
import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';
import type { ContentDescriptor } from '$lib';

export const steamApps = sqliteTable('steam_apps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  appid: integer('appid').unique().notNull(),
  name: text('name').notNull(),
});

export type SteamApp = typeof steamApps.$inferSelect;
export type NewSteamApp = typeof steamApps.$inferInsert;

export const games = sqliteTable(
  'games',
  {
    dailyId: integer('daily_id')
      .notNull()
      .references(() => dailies.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    round: integer('round').notNull(),
    appid: integer('appid').notNull(),
    name: text('name').notNull(),
    reviewsPositive: integer('reviews_positive').notNull(),
    reviewsNegative: integer('reviews_negative').notNull(),
    description: text('description').notNull(),
    price: text('price'),
    releaseDate: text('release_date').notNull(),
    headerImage: text('header_image').notNull(),
    developers: text('developers', { mode: 'json' }).$type<string[]>().notNull(),
    publishers: text('publishers', { mode: 'json' }).$type<string[]>().notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    categories: text('categories', { mode: 'json' }).$type<string[]>().notNull(),
    genres: text('genres', { mode: 'json' }).$type<string[]>().notNull(),
    screenshots: text('screenshots', { mode: 'json' })
      .$type<{ thumbnail: string; src: string }[]>()
      .notNull(),
    trailers: text('trailers', { mode: 'json' })
      .$type<{ thumbnail: string; webm?: string; mp4?: string }[]>()
      .notNull(),
    contentDescriptors: text('content_descriptors', { mode: 'json' })
      .$type<ContentDescriptor[]>()
      .notNull(),
    requiredAge: integer('required_age').notNull().default(0),
    markedAsNsfw: integer('marked_as_nsfw', { mode: 'boolean' }).notNull().default(false),
    isHandPicked: integer('is_hand_picked', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.dailyId, t.round, t.appid] })],
);

export const gamesRelations = relations(games, ({ one }) => ({
  daily: one(dailies, {
    fields: [games.dailyId],
    references: [dailies.id],
  }),
}));

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type NewGameInfoOnly = Omit<NewGame, 'dailyId' | 'round'>;

export const dailies = sqliteTable('dailies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull().unique(),
  description: text('description'),
});

export const dailiesRelations = relations(dailies, ({ many }) => ({
  games: many(games),
}));

export type Daily = typeof dailies.$inferSelect;
export type NewDaily = typeof dailies.$inferInsert;

export const results = sqliteTable(
  'results',
  {
    dailyId: integer('daily_id')
      .notNull()
      .references(() => dailies.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    ipHashed: text('ip_hashed').notNull(),
    correctGuesses: integer('correct_guesses').notNull(),
    guesses: text('guesses', { mode: 'json' }).$type<boolean[]>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.dailyId, t.ipHashed] })],
);

export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;

export const eventLogs = sqliteTable('event_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  type: text('type').notNull(),
  data: text('data', { mode: 'json' }).notNull(),
});

export type EventLog = typeof eventLogs.$inferSelect;
export type NewEventLog = typeof eventLogs.$inferInsert;
