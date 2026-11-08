import { MatchCard, type DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import { DashboardEmptyState } from "./dashboard-empty-state";

interface DashboardHomeSectionProps {
  visibleMatches: DashboardMatchPayload[];
  suspendedFromApi: DashboardMatchPayload[];
  ctId?: string | null;
  ctName?: string | null;
  userId?: string | null;
  followedPlayerIds?: readonly string[] | string[] | null;
  activeArea?: string | null;
  openMatchDetails: (m: DashboardMatchPayload) => void;
  openMatchReport: (m: DashboardMatchPayload) => void;
  finishMatch: (m: DashboardMatchPayload) => void;
  deleteMatch: (m: DashboardMatchPayload) => void;
  openMatchEditScore?: (m: DashboardMatchPayload) => void;
  resumeMatch?: (m: DashboardMatchPayload) => void;
  openMatchSetSummary?: (m: DashboardMatchPayload) => void;
  openMatchEditInfo?: (m: DashboardMatchPayload) => void;
  onShareMatch?: (m: DashboardMatchPayload) => void;
}

/** View inicial do dashboard: anotações suspensas + lista de partidas visíveis. */
export function DashboardHomeSection({
  visibleMatches,
  suspendedFromApi,
  ctId,
  ctName,
  userId,
  followedPlayerIds,
  activeArea,
  openMatchDetails,
  openMatchReport,
  finishMatch,
  deleteMatch,
  openMatchEditScore,
  resumeMatch,
  openMatchSetSummary,
  openMatchEditInfo,
  onShareMatch,
}: DashboardHomeSectionProps) {
  return (
    <section aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="sr-only">
        Dashboard
      </h2>
      {suspendedFromApi.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-telemetry-text-muted uppercase mb-3">
            Partidas pausadas
          </h3>
          <div className="space-y-3">
            {suspendedFromApi.map((m: DashboardMatchPayload) => (
              <MatchCard
                key={m.id ?? m.suspendedSessionId}
                match={m}
                ctId={ctId}
                ctName={ctName}
                userId={userId}
                followedPlayerIds={followedPlayerIds}
                onClick={openMatchDetails}
                onReport={openMatchReport}
                onEditScore={openMatchEditScore}
                onResumeMatch={resumeMatch}
                onSetSummary={openMatchSetSummary}
                onEditInfo={openMatchEditInfo}
                onShare={onShareMatch}
              />
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {visibleMatches.length === 0 ? (
          <DashboardEmptyState activeArea={activeArea} />
        ) : (
          visibleMatches.map((m: DashboardMatchPayload) => (
            <MatchCard
              key={m.id}
              match={m}
              ctId={ctId}
              ctName={ctName}
              userId={userId}
              followedPlayerIds={followedPlayerIds}
              onClick={openMatchDetails}
              onReport={openMatchReport}
              onFinish={finishMatch}
              onDelete={deleteMatch}
              onEditScore={openMatchEditScore}
              onResumeMatch={resumeMatch}
              onSetSummary={openMatchSetSummary}
              onEditInfo={openMatchEditInfo}
              onShare={onShareMatch}
            />
          ))
        )}
      </div>
    </section>
  );
}
