'use client';

import type { MemberType } from './cadastrar-membro-confirm-modal';

export interface MembroFormData {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
  gender: 'MASCULINO' | 'FEMININO' | 'OUTRO';
  dominance: 'DESTRO' | 'CANHOTO' | 'AMBIDEXTRO';
}

interface CadastrarMembroFormProps {
  type: MemberType;
  fixedType?: MemberType;
  setType: (t: MemberType) => void;
  formData: MembroFormData;
  setFormData: React.Dispatch<React.SetStateAction<MembroFormData>>;
  submitting: boolean;
  fieldError: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CadastrarMembroForm({
  type, fixedType, setType, formData, setFormData, submitting, fieldError, onCancel, onSubmit,
}: CadastrarMembroFormProps) {
  const handleChange = (key: keyof MembroFormData, value: string) => setFormData((p) => ({ ...p, [key]: value }));

  const showTypeSelector = !fixedType;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {showTypeSelector && (
        <div className="grid grid-cols-2 gap-2 pb-2 border-b">
          {(['TREINADOR', 'ATLETA'] as MemberType[]).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`py-2 text-xs font-semibold rounded-lg border ${type === t ? 'bg-sky-50 border-sky-600 text-sky-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{t === 'TREINADOR' ? 'Treinador' : 'Atleta'}</button>
          ))}
        </div>
      )}
      <div>
        <label htmlFor="membro-nome" className="text-xs font-medium text-gray-700">Nome completo</label>
        <input id="membro-nome" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'name' ? 'border-red-500' : ''}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="membro-cpf" className="text-xs font-medium text-gray-700">CPF</label>
          <input id="membro-cpf" type="text" required value={formData.cpf} onChange={(e) => handleChange('cpf', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'cpf' ? 'border-red-500' : ''}`} />
        </div>
        <div>
          <label htmlFor="membro-nascimento" className="text-xs font-medium text-gray-700">Data de nascimento</label>
          <input id="membro-nascimento" type="date" required value={formData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'birthDate' ? 'border-red-500' : ''}`} />
        </div>
      </div>
      <div>
        <label htmlFor="membro-email" className="text-xs font-medium text-gray-700">E-mail {type === 'ATLETA' && '(opcional)'}</label>
        <input id="membro-email" type="email" required={type === 'TREINADOR'} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'email' ? 'border-red-500' : ''}`} />
      </div>
      {type === 'ATLETA' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="membro-genero" className="text-xs font-medium text-gray-700">Gênero</label>
              <select id="membro-genero" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value as any)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'gender' ? 'border-red-500' : ''}`}>
              <option value="MASCULINO">Masculino</option><option value="FEMININO">Feminino</option><option value="OUTRO">Outro</option>
            </select>
          </div>
          <div>
            <label htmlFor="membro-lateralidade" className="text-xs font-medium text-gray-700">Lateralidade</label>
              <select id="membro-lateralidade" value={formData.dominance} onChange={(e) => handleChange('dominance', e.target.value as any)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'dominance' ? 'border-red-500' : ''}`}>
              <option value="DESTRO">Destro</option><option value="CANHOTO">Canhoto</option><option value="AMBIDEXTRO">Ambidestro</option>
            </select>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2">Cancelar</button>
        <button type="submit" disabled={submitting} className="bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg hover:bg-sky-800 disabled:opacity-50 text-sm">{submitting ? 'Cadastrando...' : 'Cadastrar'}</button>
      </div>
    </form>
  );
}

