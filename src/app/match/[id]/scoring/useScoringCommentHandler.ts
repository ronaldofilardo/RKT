"use client";

import { useCallback } from "react";
import { useCommentOfflineSync } from "@/hooks/useCommentOfflineSync";
import { logger } from "@/lib/logger";
import type { ScoringPageState } from "./useScoringPageState";

export function useScoringCommentHandler(state: ScoringPageState) {
  const {
    matchId,
    tokenRef,
    setComments,
    toast,
    isOnline,
    engineRef,
    pointSequenceRef,
  } = state;

  const { enqueueComment } = useCommentOfflineSync();

  const handleCommentCreate = useCallback(
    async (
      content: string,
      audio?: { blob: Blob; durationMs: number },
      category?: string,
    ) => {
      let contextPrefix = "";
      const engineState = engineRef.current?.getState();
      if (engineState && engineState.sets.length > 0) {
        const game = engineState.currentGame;
        const currentSet = engineState.sets[engineState.sets.length - 1];
        const isTiebreak = currentSet?.isTiebreak;

        let p1Score = "0";
        let p2Score = "0";

        if (isTiebreak && currentSet.tiebreakScore) {
          p1Score = String(currentSet.tiebreakScore.player1);
          p2Score = String(currentSet.tiebreakScore.player2);
        } else if (game.isDeuce) {
          p1Score = game.advantage === "player1" ? "AD" : "40";
          p2Score = game.advantage === "player2" ? "AD" : "40";
        } else {
          const map = [0, 15, 30, 40];
          p1Score = String(map[game.player1] ?? game.player1);
          p2Score = String(map[game.player2] ?? game.player2);
        }

        const gamesP1 = currentSet.player1;
        const gamesP2 = currentSet.player2;
        const setNumber = engineState.sets.length;
        const pointNumber = pointSequenceRef.current + 1;

        contextPrefix = `[Set ${setNumber} · Game ${gamesP1}x${gamesP2} · Pt ${pointNumber} (${p1Score}x${p2Score})] `;
      }

      const finalContent =
        contextPrefix +
        (content?.trim() || (audio ? "(Nota de voz)" : ""));

      // Offline: enqueue for later sync
      if (!isOnline) {
        await enqueueComment({
          matchId,
          type: "COMMENT",
          payload: {
            content: finalContent,
            category,
            audioBlob: audio?.blob,
            audioDurationMs: audio?.durationMs,
          },
          timestamp: Date.now(),
        });
        toast({
          type: "success",
          message: "Comentário salvo localmente, sincronizando ao reconectar",
        });
        return;
      }

      try {
        const token = tokenRef.current;
        const res = await fetch(`/api/matches/${matchId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: finalContent, category }),
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
              "[handleCommentCreate] audio upload failed",
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
    },
    [
      matchId,
      tokenRef,
      setComments,
      toast,
      isOnline,
      enqueueComment,
      engineRef,
      pointSequenceRef,
    ],
  );

  return { handleCommentCreate };
}
