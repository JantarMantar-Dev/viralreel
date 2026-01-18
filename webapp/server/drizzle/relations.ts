import { relations } from "drizzle-orm/relations";
import { user, account, session, video, script, series, contentNiche, creditBalance, creditTransaction, paymentHistory, userSubscription, subscriptionPlan, renderJob } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	series: many(series),
	creditBalances: many(creditBalance),
	creditTransactions: many(creditTransaction),
	paymentHistories: many(paymentHistory),
	userSubscriptions: many(userSubscription),
	videos: many(video),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const scriptRelations = relations(script, ({one}) => ({
	video: one(video, {
		fields: [script.videoId],
		references: [video.id]
	}),
}));

export const videoRelations = relations(video, ({one, many}) => ({
	scripts: many(script),
	creditTransactions: many(creditTransaction),
	renderJobs: many(renderJob),
	user: one(user, {
		fields: [video.userId],
		references: [user.id]
	}),
	series: one(series, {
		fields: [video.seriesId],
		references: [series.id]
	}),
	contentNiche: one(contentNiche, {
		fields: [video.nicheId],
		references: [contentNiche.id]
	}),
}));

export const seriesRelations = relations(series, ({one, many}) => ({
	user: one(user, {
		fields: [series.userId],
		references: [user.id]
	}),
	contentNiche: one(contentNiche, {
		fields: [series.nicheId],
		references: [contentNiche.id]
	}),
	creditTransactions: many(creditTransaction),
	videos: many(video),
}));

export const contentNicheRelations = relations(contentNiche, ({many}) => ({
	series: many(series),
	videos: many(video),
}));

export const creditBalanceRelations = relations(creditBalance, ({one, many}) => ({
	user: one(user, {
		fields: [creditBalance.userId],
		references: [user.id]
	}),
	creditTransactions: many(creditTransaction),
}));

export const creditTransactionRelations = relations(creditTransaction, ({one}) => ({
	user: one(user, {
		fields: [creditTransaction.userId],
		references: [user.id]
	}),
	creditBalance: one(creditBalance, {
		fields: [creditTransaction.creditBalanceId],
		references: [creditBalance.id]
	}),
	video: one(video, {
		fields: [creditTransaction.videoId],
		references: [video.id]
	}),
	series: one(series, {
		fields: [creditTransaction.seriesId],
		references: [series.id]
	}),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({one}) => ({
	user: one(user, {
		fields: [paymentHistory.userId],
		references: [user.id]
	}),
}));

export const userSubscriptionRelations = relations(userSubscription, ({one}) => ({
	user: one(user, {
		fields: [userSubscription.userId],
		references: [user.id]
	}),
	subscriptionPlan: one(subscriptionPlan, {
		fields: [userSubscription.planId],
		references: [subscriptionPlan.id]
	}),
}));

export const subscriptionPlanRelations = relations(subscriptionPlan, ({many}) => ({
	userSubscriptions: many(userSubscription),
}));

export const renderJobRelations = relations(renderJob, ({one}) => ({
	video: one(video, {
		fields: [renderJob.videoId],
		references: [video.id]
	}),
}));