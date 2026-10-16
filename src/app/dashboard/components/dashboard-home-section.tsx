import { MatchCard, type DashboardMatchPayload } from "@/components/dashboard/MatchCard";

interface DashboardHomeSectionProps {
  visibleMatches: DashboardMatchPayload[];
  suspendedFromApi: DashboardMatchPayload[];
  handleMatchClick: (m: DashboardMatchPayload) => void;
  handleMatchReport: (m: DashboardMatchPayload) => void;
  handleMatchFinish: (m: DashboardMatchPayload) => void;
  handleMatchDelete: (m: DashboardMatchPayload) => void;
  handleMatchEditScore?: (m: DashboardMatchPayload) => void;
  handleMatchResume?: (m: DashboardMatchPayload) => void;
  handleMatchSetSummary?: (m: DashboardMatchPayload) => void;
  handleMatchEditInfo?: (m: DashboardMatchPayload) => void;
}

/** View inicial do dashboard: anotações suspensas + lista de partidas visíveis. */
export function DashboardHomeSection({
  visibleMatches,
  suspendedFromApi,
  handleMatchClick,
  handleMatchReport,
  handleMatchFinish,
  handleMatchDelete,
  handleMatchEditScore,
  handleMatchResume,
  handleMatchSetSummary,
  handleMatchEditInfo,
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
                onClick={handleMatchClick}
                onReport={handleMatchReport}
                onEditScore={handleMatchEditScore}
                onResumeMatch={handleMatchResume}
                onSetSummary={handleMatchSetSummary}
                onEditInfo={handleMatchEditInfo}
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
              onClick={handleMatchClick}
              onReport={handleMatchReport}
              onFinish={handleMatchFinish}
              onDelete={handleMatchDelete}
              onEditScore={handleMatchEditScore}
              onResumeMatch={handleMatchResume}
              onSetSummary={handleMatchSetSummary}
              onEditInfo={handleMatchEditInfo}
            />
          ))
        )}
      </div>
    </section>
  );
}
