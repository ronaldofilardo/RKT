import React from 'react';

interface EditAthletePersonalFieldsProps {
  form: {
    name: string;
    gender: string;
    birthDay: string;
    birthMonth: string;
    birthYear: string;
    dominance: string;
    backhand: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  saving: boolean;
}

export function EditAthletePersonalFields({ form, setForm, saving }: EditAthletePersonalFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="edit-athlete-name" className="block text-xs font-medium text-gray-700 mb-0.5">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-athlete-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
          disabled={saving}
          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 text-sm"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label htmlFor="edit-athlete-gender" className="block text-xs font-medium text-gray-700 mb-0.5">Sexo</label>
          <select
            id="edit-athlete-gender"
            value={form.gender}
            onChange={(e) => setForm((p: any) => ({ ...p, gender: e.target.value }))}
            disabled={saving}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-xs"
          >
            <option value="">Sel.</option>
            <option value="MALE">M</option>
            <option value="FEMALE">F</option>
          </select>
        </div>
        <div className="col-span-3">
          <label htmlFor="edit-athlete-birthday" className="block text-xs font-medium text-gray-700 mb-0.5">Data de Nascimento</label>
          <div className="flex items-center gap-1">
            <input id="edit-athlete-birthday" type="number" min="1" max="31" value={form.birthDay}
              onChange={(e) => setForm((p: any) => ({ ...p, birthDay: e.target.value }))}
              disabled={saving} placeholder="DD" maxLength={2}
              className="w-12 px-1 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-xs" />
            <span className="text-gray-500 font-medium text-xs">/</span>
            <input aria-label="Mês de nascimento" type="number" min="1" max="12" value={form.birthMonth}
              onChange={(e) => setForm((p: any) => ({ ...p, birthMonth: e.target.value }))}
              disabled={saving} placeholder="MM" maxLength={2}
              className="w-12 px-1 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-xs" />
            <span className="text-gray-500 font-medium text-xs">/</span>
            <input aria-label="Ano de nascimento" type="number" min="1900" max="2030" value={form.birthYear}
              onChange={(e) => setForm((p: any) => ({ ...p, birthYear: e.target.value }))}
              disabled={saving} placeholder="AAAA" maxLength={4}
              className="w-16 px-1 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-xs" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-athlete-dominance" className="block text-xs font-medium text-gray-700 mb-0.5">Dominância</label>
          <select
            id="edit-athlete-dominance"
            value={form.dominance}
            onChange={(e) => setForm((p: any) => ({ ...p, dominance: e.target.value }))}
            disabled={saving}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-xs"
          >
            <option value="">Sel.</option>
            <option value="RIGHT">Destro</option>
            <option value="LEFT">Canhoto</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-athlete-backhand" className="block text-xs font-medium text-gray-700 mb-0.5">Backhand</label>
          <select
            id="edit-athlete-backhand"
            value={form.backhand}
            onChange={(e) => setForm((p: any) => ({ ...p, backhand: e.target.value }))}
            disabled={saving}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-xs"
          >
            <option value="">Sel.</option>
            <option value="ONE_HANDED">1 mão</option>
            <option value="TWO_HANDED">2 mãos</option>
          </select>
        </div>
      </div>
    </>
  );
}
