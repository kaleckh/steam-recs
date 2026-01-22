-- DropIndex
DROP INDEX "games_embedding_idx";

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "is_free" BOOLEAN,
ADD COLUMN     "metacritic_score" INTEGER,
ADD COLUMN     "release_year" INTEGER,
ADD COLUMN     "review_count" INTEGER,
ADD COLUMN     "review_positive_pct" INTEGER,
ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "steam_id" TEXT,
    "preference_vector" vector(384),
    "last_updated" TIMESTAMP(3),
    "games_analyzed" INTEGER NOT NULL DEFAULT 0,
    "total_playtime_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_games" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "app_id" BIGINT NOT NULL,
    "playtime_minutes" INTEGER NOT NULL,
    "playtime_recent" INTEGER,
    "last_played" TIMESTAMP(3),
    "achievements_earned" INTEGER,
    "achievements_total" INTEGER,
    "computed_weight" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_steam_id_key" ON "user_profiles"("steam_id");

-- CreateIndex
CREATE INDEX "user_profiles_steam_id_idx" ON "user_profiles"("steam_id");

-- CreateIndex
CREATE INDEX "user_games_user_id_idx" ON "user_games"("user_id");

-- CreateIndex
CREATE INDEX "user_games_app_id_idx" ON "user_games"("app_id");

-- CreateIndex
CREATE INDEX "user_games_playtime_minutes_idx" ON "user_games"("playtime_minutes");

-- CreateIndex
CREATE UNIQUE INDEX "user_games_user_id_app_id_key" ON "user_games"("user_id", "app_id");

-- CreateIndex
CREATE INDEX "games_release_year_idx" ON "games"("release_year");

-- CreateIndex
CREATE INDEX "games_review_positive_pct_idx" ON "games"("review_positive_pct");

-- CreateIndex
CREATE INDEX "games_is_free_idx" ON "games"("is_free");

-- CreateIndex
CREATE INDEX "games_type_idx" ON "games"("type");

-- AddForeignKey
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "games"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;
