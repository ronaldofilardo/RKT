import type { MemberType, ClubMatchItem, CoachItem } from './types';
import { CadastrarMembroModal } from './cadastrar-membro-modal';
import { EditAthleteModal } from '@/app/atletas/EditAthleteModal';
import { IndicarAnotadorModal } from './indicar-anotador-modal';
import { EditMatchInfoModal } from '@/components/dashboard/EditMatchInfoModal';
import { clubMatchToDashboardPayload, executeDeleteMatch } from './gestor-match-actions.logic';
import { ConfirmDeleteMatchDialog } from '@/app/dashboard/components/ConfirmDeleteMatchDialog';
import { playersClient } from '@/services/playersClient';

interface GestorDashboardModalsProps {
  cadastroOpen: boolean;
  setCadastroOpen: (open: boolean) => void;
  cadastroType: MemberType;
  newAthleteOpen: boolean;
  setNewAthleteOpen: (open: boolean) => void;
  gestorCtId: string | null;
  matchToAssign: ClubMatchItem | null;
  setMatchToAssign: (m: ClubMatchItem | null) => void;
  matchToEdit: ClubMatchItem | null;
  setMatchToEdit: (m: ClubMatchItem | null) => void;
  matchToDelete: ClubMatchItem | null;
  setMatchToDelete: (m: ClubMatchItem | null) => void;
  coaches: CoachItem[];
  fetchCoachesData: () => Promise<void>;
  fetchAthletesData: () => Promise<void>;
  fetchMatchesData: () => Promise<void>;
}

export function GestorDashboardModals({
  cadastroOpen, setCadastroOpen, cadastroType,
  newAthleteOpen, setNewAthleteOpen, gestorCtId,
  matchToAssign, setMatchToAssign, matchToEdit, setMatchToEdit,
  matchToDelete, setMatchToDelete,
  coaches, fetchCoachesData, fetchAthletesData, fetchMatchesData,
}: GestorDashboardModalsProps) {
  return (
    <>
      <CadastrarMembroModal open={cadastroOpen} onOpenChange={setCadastroOpen} initialType={cadastroType} fixedType={cadastroType} onSave={() => { fetchCoachesData(); fetchAthletesData(); }} />
      <EditAthleteModal
        isOpen={newAthleteOpen} athlete={null} showCpf={true} onClose={() => setNewAthleteOpen(false)}
        onSave={async (payload) => {
          const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
          await playersClient.create({ ...payload, myClub: true, ctId: gestorCtId }, token);
          setNewAthleteOpen(false);
          await fetchAthletesData();
        }}
      />
      <IndicarAnotadorModal open={Boolean(matchToAssign)} onOpenChange={(op) => !op && setMatchToAssign(null)} match={matchToAssign} coaches={coaches} onSuccess={fetchMatchesData} />
      {matchToEdit && (
        <EditMatchInfoModal
          match={clubMatchToDashboardPayload(matchToEdit)}
          onClose={() => setMatchToEdit(null)}
          onSuccess={() => { setMatchToEdit(null); fetchMatchesData(); }}
        />
      )}
      {matchToDelete && (
        <ConfirmDeleteMatchDialog
          onCancel={() => setMatchToDelete(null)}
          onConfirm={async () => {
            const ok = await executeDeleteMatch(matchToDelete);
            setMatchToDelete(null);
            if (ok) await fetchMatchesData();
          }}
        />
      )}
    </>
  );
}
