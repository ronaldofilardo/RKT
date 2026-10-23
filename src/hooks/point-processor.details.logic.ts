import { logger } from "@/lib/logger";
import type { RallyDetailsWithAttribution } from "@/core/scoring/types";
import type { ConfirmPointDetailsDeps } from "./point-processor.types";

export function createConfirmPointDetails({
  match,
  modalParamsRef,
  serveErrorState,
  serverHelpers,
  closeAll,
  isProcessingRef,
  applyPoint,
  clearFirstServeError,
  setServeStep,
  uploadAudioNote,
  tokenRef,
  onAudioUploaded,
  setError,
}: ConfirmPointDetailsDeps) {
  return (
    details: RallyDetailsWithAttribution,
    audio?: { blob: Blob; durationMs: number },
  ) => {
    const winnerSide = modalParamsRef.current.winner as "player1" | "player2";
    const rallyLengthFromModal = modalParamsRef.current.rallyLength;
    if (!match || !winnerSide || isProcessingRef.current) return;

    const rallyLengthToUse = rallyLengthFromModal
      ? parseInt(rallyLengthFromModal, 10) || details.previewBalls
      : details.previewBalls;

    const id = winnerSide === "player1" ? match.player1.id : match.player2.id;

    // Regra canônica: um ACE só é registrado direto em /scoring ou via modal de detalhes do saque (ServerEffectModal).
    // Jamais um ACE é cadastrado via detalhes do ponto (PointDetailsModal).
    // Pontos com details.tipo === "winner" em detalhes do ponto são sempre "WINNER".
    const flowType =
      details.tipo === "winner"
        ? "WINNER"
        : details.tipo === "erro_forcado"
          ? "FORCED_ERROR"
          : "UNFORCED_ERROR";
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;

    closeAll();

    applyPoint({
      winnerId: id,
      type: flowType,
      serverId: serverHelpers.getServerId(),
      isFirstServe: serveErrorState.serveStep !== "second" && !serveErrorState.firstServeError,
      isSecondServe: serveErrorState.serveStep === "second" || serveErrorState.firstServeError !== null,
      timestamp: Date.now(),
      rallyDetails: details,
      rallyLength: rallyLengthToUse,
      firstFaultDetail,
      hitterId: details.hitterId,
      receiverId: details.receiverId,
    }).then((pointLogId) => {
      clearFirstServeError();
      setServeStep("none");

      if (audio) {
        if (pointLogId && uploadAudioNote) {
          uploadAudioNote(match.id, pointLogId, audio.blob, audio.durationMs, tokenRef.current)
            .then(() => onAudioUploaded?.())
            .catch((err) => {
              logger.error("[confirmPointDetails] Falha no upload do áudio da nota:", err);
            });
        } else {
          logger.warn(
            "[confirmPointDetails] Áudio gravado não pôde ser enviado imediatamente (modo offline ou sem pointLogId)",
            { matchId: match.id },
          );
          setError(
            "O ponto foi salvo, mas o áudio da anotação não pôde ser sincronizado no momento (requer conexão ativa).",
          );
        }
      }
    });
  };
}
