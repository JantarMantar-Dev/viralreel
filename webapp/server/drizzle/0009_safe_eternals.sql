ALTER TABLE "credit_balance" DROP CONSTRAINT IF EXISTS "credit_balance_plan_id_subscription_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "credit_balance" DROP COLUMN IF EXISTS "plan_id";--> statement-breakpoint
ALTER TABLE "credit_balance" DROP CONSTRAINT IF EXISTS "credit_balance_user_id_unique";
--> statement-breakpoint
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_user_id_unique" UNIQUE("user_id");