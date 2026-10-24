import type { ToastType } from "@/components/Toast";
import type { DeletableMatch } from "./dashboard.types";

interface DeleteMatchOptions {
  matchToDelete: DeletableMatch | null;
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
    } catch (error) {
      toast({
        type: "error",
        message:
          (error instanceof Error ? error.message : "") || "Erro ao excluir partida",
      });
    }
  };

  return { confirmDeleteMatch };
}
