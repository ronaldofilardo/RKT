import { logger } from "@/lib/logger";
import type { MatchCommentData } from "./useScoringTimelineSync";

type ToastFn = (t: { type: "success" | "error" | "info"; message: string }) => void;

type CommentAudio = { blob: Blob; durationMs: number };

export async function submitCommentOnline(args: {
  matchId: string;
  token: string | null;
  content: string;
  category?: string;
  audio?: CommentAudio;
  setComments: React.Dispatch<React.SetStateAction<MatchCommentData[]>>;
  toast: ToastFn;
}): Promise<void> {
  const { matchId, token, content, category, audio, setComments, toast } = args;

  try {
    const res = await fetch(`/api/matches/${matchId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content, category }),
    });

    if (!res.ok) {
      toast({ type: "error", message: "Erro ao criar comentário" });
      return;
    }

    const comment = await res.json();

    if (audio && comment.id) {
      const formData = new FormData();
      formData.append("file", audio.blob);
      formData.append("durationMs", String(audio.durationMs));
      const audioRes = await fetch(
        `/api/matches/${matchId}/comments/${comment.id}/audio`,
        {
          method: "POST",
          headers: token ? { authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );
      if (!audioRes.ok) {
        logger.error(
          "[createMatchComment] audio upload failed",
          audioRes.status,
        );
        toast({
          type: "info",
          message: "Comentário criado, mas áudio não foi salvo",
        });
      }
    }

    setComments((prev) => [
      {
        id: comment.id,
        content: comment.content,
        category: comment.category,
        authorName: comment.authorName,
        createdAt: comment.createdAt,
        hasAudioNote: Boolean(audio),
        audioNoteDuration: audio?.durationMs ?? null,
      },
      ...prev,
    ]);

    toast({ type: "success", message: "Comentário registrado" });
  } catch {
    toast({ type: "error", message: "Erro ao criar comentário" });
  }
}
