import type { MatchFinishReason } from "@/schemas/contracts";
import type { ToastType } from "@/components/Toast";
import type { FinishableMatch } from "./dashboard.types";

interface FinishMatchOptions {
  matchToFinish: FinishableMatch | null;
  fetchDashboardData: () => void;
  toast: (opts: { type: ToastType; message: string }) => void;
}

export function useFinishMatch(options: FinishMatchOptions) {
  const { matchToFinish, fetchDashboardData, toast } = options;

  const confirmFinishMatch = async (
    reason: MatchFinishReason,
    note?: string
  ) => {
    if (!matchToFinish) return;

    try {
      const accessToken = sessionStorage.getItem("access_token");

      const res = await fetch(`/api/matches/${matchToFinish.id}/finish`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
          note,
          scoreState: matchToFinish.scoreState,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro ao encerrar partida");
      }

      toast({
        type: "success",
        message: "Partida finalizada com sucesso!",
      });

      fetchDashboardData();
    } catch (error) {
      toast({
        type: "error",
        message:
          (error instanceof Error ? error.message : "") || "Erro ao encerrar partida",
      });
    }
  };

  return { confirmFinishMatch };
}
