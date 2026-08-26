import type { Athlete } from '../types';
import type { RankingState } from '@/app/atletas/rankingLogic';
import { rankingsStateToPayload } from '@/app/atletas/rankingLogic';

type Form = { name: string; gender: string; birthDay: string; birthMonth: string; birthYear: string; dominance: string; backhand: string };
type Created = Athlete & { age?: number | null; ranking?: number | null };
type ResponseData = { data?: Created } & Created;

function buildBirthDate(form: Form) { return form.birthYear && form.birthMonth && form.birthDay ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}` : undefined; }
function buildPayload(form: Form, rankings: Record<string, RankingState>) { const rankingPayload = rankingsStateToPayload(rankings); return { name: form.name.trim(), gender: form.gender || undefined, birthDate: buildBirthDate(form), dominance: form.dominance || undefined, backhand: form.backhand || undefined, rankings: Object.keys(rankingPayload).length > 0 ? rankingPayload : undefined }; }
function getHeaders(token: string | null, userId: string | null) { return { 'Content-Type': 'application/json', authorization: `Bearer ${token}`, 'x-user-id': userId || '' }; }
async function readCreated(response: Response): Promise<Created> { const json = await response.json() as ResponseData; return json.data || json; }
async function createRequest(form: Form, rankings: Record<string, RankingState>): Promise<Response> { const token = sessionStorage.getItem('access_token'); const userId = sessionStorage.getItem('user_id'); return fetch('/api/players', { method: 'POST', headers: getHeaders(token, userId), body: JSON.stringify(buildPayload(form, rankings)) }); }
export async function submitNewAthlete(form: Form, rankings: Record<string, RankingState>): Promise<Created> { const response = await createRequest(form, rankings); if (!response.ok) { const data = await response.json() as { message?: string }; throw new Error(data.message || 'Erro ao criar atleta'); } return readCreated(response); }
