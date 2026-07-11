-- Remove BEST_OF_3_NO_AD from MatchFormat enum
BEGIN;

-- Create new enum type without BEST_OF_3_NO_AD
CREATE TYPE "MatchFormat_new" AS ENUM ('BEST_OF_3', 'BEST_OF_3_MATCH_TB', 'BEST_OF_5', 'SHORT_SET_2V2_NO_AD', 'MATCH_TB_10', 'PRO_SET_8');

-- Alter column to use new enum type
ALTER TABLE "Match" ALTER COLUMN "format" TYPE "MatchFormat_new" USING (
  CASE 
    WHEN "format"::text = 'BEST_OF_3_NO_AD' THEN 'BEST_OF_3_MATCH_TB'::"MatchFormat_new"
    ELSE "format"::text::"MatchFormat_new"
  END
);

-- Drop old enum type
DROP TYPE "MatchFormat";

-- Rename new enum to original name
ALTER TYPE "MatchFormat_new" RENAME TO "MatchFormat";

COMMIT;