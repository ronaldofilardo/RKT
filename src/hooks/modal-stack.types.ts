export interface ModalParams {
  [key: string]: string;
}

export type ModalMode = 'router' | 'internal';

export interface ModalStackOptions {
  mode?: ModalMode;
}
