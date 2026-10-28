interface SignupFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  identifier: string;
  setIdentifier: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  role: 'ATLETA' | 'TREINADOR' | 'ESPECTADOR' | 'GESTOR';
  setRole: (v: 'ATLETA' | 'TREINADOR' | 'ESPECTADOR' | 'GESTOR') => void;
}

export function SignupFormFields({
  name,
  setName,
  identifier,
  setIdentifier,
  password,
  setPassword,
  role,
  setRole,
}: SignupFormFieldsProps) {
  return (
    <>
      <input
        type="text"
        placeholder="Nome completo"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <input
        type="text"
        placeholder="E-mail ou CPF"
        required
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <input
        type="password"
        placeholder="Senha (mínimo 8 caracteres)"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <label htmlFor="signup-role-select" className="font-medium">
          Perfil principal:
        </label>
        <select
          id="signup-role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full border rounded-lg p-2.5 text-sm bg-white"
        >
          <option value="ATLETA">Atleta</option>
          <option value="TREINADOR">Treinador</option>
          <option value="ESPECTADOR">Espectador / Responsável</option>
          <option value="GESTOR">Gestor de Clube / CT</option>
        </select>
      </div>
    </>
  );
}
