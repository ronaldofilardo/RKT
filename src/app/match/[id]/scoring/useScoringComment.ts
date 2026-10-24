"use client";

import { useCallback } from "react";
import { useCommentOfflineSync } from "@/hooks/useCommentOfflineSync";
import type { ScoringPageState } from "./useScoringPageState";
import { buildCommentContextPrefix } from "./scoring-comment-context.logic";
import { submitCommentOnline } from "./scoring-comment-submit.logic";

export function useScoringComment(state: ScoringPageState) {
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

  const createMatchComment = useCallback(
    async (
      content: string,
      audio?: { blob: Blob; durationMs: number },
      category?: string,
    ) => {
      const contextPrefix = buildCommentContextPrefix(
        engineRef.current?.getState(),
        pointSequenceRef.current + 1,
      );

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

      await submitCommentOnline({
        matchId,
        token: tokenRef.current,
        content: finalContent,
        category,
        audio,
        setComments,
        toast,
      });
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

  return { createMatchComment };
}
