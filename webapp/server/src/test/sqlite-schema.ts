
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: 'boolean' }).notNull(),
    image: text("image"),
    stripeCustomerId: text("stripe_customer_id").unique(),
    planTag: text("plan_tag").default("launch"),
    createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull(),
});

export const creditBalance = sqliteTable("credit_balance", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id).unique(),
    amountTotal: integer("amount_total").notNull(),
    amountUsed: integer("amount_used").default(0).notNull(),
    expiresAt: integer("expires_at", { mode: 'timestamp' }),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const creditTransaction = sqliteTable("credit_transaction", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    creditBalanceId: text("credit_balance_id").references(() => creditBalance.id),
    amount: integer("amount").notNull(),
    description: text("description"),
    comment: text("comment"),
    videoId: text("video_id"),
    seriesId: text("series_id"),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
});
