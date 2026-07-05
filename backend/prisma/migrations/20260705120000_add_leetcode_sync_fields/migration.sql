ALTER TABLE "leetcode_profiles"
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "avatar" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "reputation" INTEGER,
  ADD COLUMN "bestContestRanking" INTEGER,
  ADD COLUMN "totalContestsParticipated" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "dailySolvedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "weeklySolvedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "monthlySolvedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "totalActiveDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastSubmissionDate" TIMESTAMP(3),
  ADD COLUMN "recentSubmissions" JSONB,
  ADD COLUMN "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING';
