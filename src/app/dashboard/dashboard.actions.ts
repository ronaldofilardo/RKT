import type { MatchFinishReason } from "@/schemas/contracts";
import type { ToastType } from "@/components/Toast";

interface DeleteMatchOptions {
  matchToDelete: any;
  fetchDashboardData: () => void;
  toast: (opts: { type: ToastType; message: string }) => void;
}

export function useDeleteMatch(options: DeleteMatchOptions) {
  const { matchToDelete, fetchDashboardData, toast } = options;

  const confirmDeleteMatch = async (type: "soft" | "hard", reason?: string) => {
    if (!matchToDelete) return;

    try {
      const accessToken = sessionStorage.getItem("access_token");
      const params = new URLSearchParams({ type });
      if (reason) params.append("reason", reason);

      const res = await fetch(
        `/api/matches/${matchToDelete.id}?${params}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${accessToken}` },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro ao excluir partida");
      }

      toast({
        type: "success",
        message:
          type === "soft"
            ? "Partida marcada como cancelada"
            : "Partida excluída permanentemente",
      });

      fetchDashboardData();
    } catch (error: any) {
      toast({
        type: "error",
        message: error.message || "Erro ao excluir partida",
      });
    }
  };

  return { confirmDeleteMatch };
}

interface FinishMatchOptions {
  matchToFinish: any;
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
    } catch (error: any) {
      toast({
        type: "error",
        message: error.message || "Erro ao encerrar partida",
      });
    }
  };

  return { confirmFinishMatch };
}