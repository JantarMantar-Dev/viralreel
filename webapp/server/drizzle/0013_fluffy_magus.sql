ALTER TABLE "credit_transaction" DROP CONSTRAINT "credit_transaction_video_id_video_id_fk";
--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD COLUMN "comment" text;