import { MatchCard, type DashboardMatchPayload } from "@/components/dashboard/MatchCard";

interface DashboardHomeSectionProps {
  visibleMatches: DashboardMatchPayload[];
  suspendedFromApi: DashboardMatchPayload[];
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
            Anotações Suspensas
          </h3>
          <div className="space-y-3">
            {suspendedFromApi.map((m: DashboardMatchPayload) => (
              <MatchCard
                key={m.id ?? m.suspendedSessionId}
                match={m}
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
          <p className="text-telemetry-text-muted text-center py-8">
            Nenhuma partida encontrada.
          </p>
        ) : (
          visibleMatches.map((m: DashboardMatchPayload) => (
            <MatchCard
              key={m.id}
              match={m}
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
