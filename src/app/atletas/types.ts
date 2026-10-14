/** Estado do formulário de cadastro/edição de atleta. */
export interface AthleteForm {
  name: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  dominance: string;
  backhand: string;
}

/** Estado inicial do formulário de atleta. */
export const EMPTY_ATHLETE_FORM: AthleteForm = {
  name: "",
  gender: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  dominance: "",
  backhand: "",
};
