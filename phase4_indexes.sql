CREATE INDEX CONCURRENTLY IF NOT EXISTS "Match_createdByUserId_createdAt_idx" ON "Match" ("createdByUserId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "match_annotation_sessions_matchId_isActive_idx" ON "match_annotation_sessions" ("matchId", "isActive");

EXPLAIN ANALYZE SELECT * FROM "Match" WHERE "createdByUserId" = 'user1' ORDER BY "createdAt" DESC LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM "match_annotation_sessions" WHERE "matchId" = 'match1' AND "isActive" = true;
