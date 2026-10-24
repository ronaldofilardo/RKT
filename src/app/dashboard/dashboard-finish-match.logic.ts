import type { ToastType } from "@/components/Toast";
import type { FinishableMatch } from "./dashboard.types";
import { logger } from "@/lib/logger";

interface FinishMatchOptions {
  matchToFinish: FinishableMatch | null;
  setMatchToFinish: (m: FinishableMatch | null) => void;
  fetchDashboardData: () => void;
  toast: (opts: { type: ToastType; message: string }) => void;
}

export function useFinishMatch(options: FinishMatchOptions) {
  const { matchToFinish, setMatchToFinish, fetchDashboardData, toast } = options;

  const confirmFinishMatch = async (
    commentText?: string,
    audio?: { blob: Blob; durationMs: number },
  ) => {
    if (!matchToFinish) return;

    try {
      const accessToken = sessionStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      };

      // 1. Se houver comentário (texto ou áudio), salva como comentário da partida
      const content = commentText?.trim();
      if (content || audio) {
        try {
          const commentRes = await fetch(`/api/matches/${matchToFinish.id}/comments`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              content: content || "Partida encerrada",
              category: "GERAL",
            }),
          });

          if (commentRes.ok && audio) {
            const comment = await commentRes.json();
            const formData = new FormData();
            formData.append("file", audio.blob);
            formData.append("durationMs", String(audio.durationMs));
            await fetch(`/api/matches/${matchToFinish.id}/comments/${comment.id}/audio`, {
              method: "POST",
              headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
              body: formData,
            });
          }
        } catch (commentErr) {
          logger.warn("[finishMatch] Falha ao registrar comentário final:", commentErr);
        }
      }

      // 2. Encerra a partida via API /finish
      const score = matchToFinish.scoreState as { isFinished?: boolean } | null | undefined;
      const reason = score?.isFinished ? "COMPLETED" : "OUTRO";

      const res = await fetch(`/api/matches/${matchToFinish.id}/finish`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          reason,
          note: content || undefined,
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

      setMatchToFinish(null);
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
