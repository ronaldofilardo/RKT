/** Estado do formulário de cadastro/edição de atleta. */
export interface AthleteForm {
  name: string;
  cpf?: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  dominance: string;
  backhand: string;
  uf: string;
  city: string;
  club: string;
}

/** Estado inicial do formulário de atleta. */
export const EMPTY_ATHLETE_FORM: AthleteForm = {
  name: "",
  cpf: "",
  gender: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  dominance: "",
  backhand: "",
  uf: "",
  city: "",
  club: "",
};
