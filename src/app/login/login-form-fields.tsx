'use client';

export function LoginFormFields() {
  return (
    <>
      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="identifier"
        >
          E-mail ou CPF
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="ex: usuario@email.com ou 123.456.789-00"
          required
          className="w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="password"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </>
  );
}
