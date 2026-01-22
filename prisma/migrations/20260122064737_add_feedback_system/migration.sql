-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "feedback_dislikes_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "feedback_likes_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "learned_vector" vector(384),
ADD COLUMN     "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN     "subscription_tier" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "app_id" BIGINT NOT NULL,
    "feedback_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_feedback_user_id_idx" ON "user_feedback"("user_id");

-- CreateIndex
CREATE INDEX "user_feedback_app_id_idx" ON "user_feedback"("app_id");

-- CreateIndex
CREATE INDEX "user_feedback_feedback_type_idx" ON "user_feedback"("feedback_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_feedback_user_id_app_id_key" ON "user_feedback"("user_id", "app_id");

-- CreateIndex
CREATE INDEX "user_profiles_subscription_tier_idx" ON "user_profiles"("subscription_tier");

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "games"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;
