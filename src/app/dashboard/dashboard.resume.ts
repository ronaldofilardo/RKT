import type { TennisFormat } from "@/core/scoring/types";
import {
  buildResumeSession,
  buildSessionStorageData,
  readStoredSessionData,
  resolveFloorSets,
  resolveResumeScoreState,
} from "./dashboard.resume.helpers";

interface ResumeSessionOptions {
  router: any;
  setSession: (session: any) => void;
  setPendingEdit: (scoreState: any, floorSets: any) => void;
}

export function useResumeSession(options: ResumeSessionOptions) {
  const { router, setSession, setPendingEdit } = options;

  const handleResumeSuspended = (match: any) => {
    const isRealSuspendedSession = Boolean(
      match.matchStateSnapshot && match.suspendedSessionId
    );
    const scoreState = resolveResumeScoreState(match.scoreState);
    const floorSets = resolveFloorSets(
      scoreState,
      match.format as TennisFormat
    );

    setSession(buildResumeSession(match, scoreState));
    if (scoreState) setPendingEdit(scoreState, floorSets);

    const sessionStorageData = readStoredSessionData(
      match.id,
      isRealSuspendedSession,
      buildSessionStorageData(match, scoreState)
    );
    sessionStorage.setItem(
      `suspended_session_${match.id}`,
      JSON.stringify(sessionStorageData)
    );
    router.push(`/match/${match.id}/scoring`);
  };

  return { handleResumeSuspended };
}
