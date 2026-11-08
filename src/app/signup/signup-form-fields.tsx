import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { SignupFieldFeedback } from './signup-field-feedback';
import { SignupRoleAndTerms } from './signup-role-and-terms';
import { isEmailIdentifier } from './signup-validation.logic';
import type { SignupFormController } from './use-signup-form';

export function SignupFormFields({ form }: { form: SignupFormController }) {
  const isGestor = form.role === 'GESTOR';
  const identifierIsEmail = isEmailIdentifier(form.identifier);

  return (
    <>
      <div>
        <label htmlFor="signup-name" className="sr-only">Nome completo</label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Nome completo"
          required={!isGestor}
          value={form.name}
          onChange={(e) => form.handleNameChange(e.target.value)}
          onBlur={() => form.handleBlur('name')}
          aria-invalid={Boolean(form.fieldErrors.name)}
          aria-describedby={form.fieldErrors.name ? 'signup-name-feedback' : undefined}
          className="w-full border rounded-lg p-3 text-sm"
        />
        <SignupFieldFeedback id="signup-name-feedback" error={form.fieldErrors.name} />
      </div>

      <div>
        <label htmlFor="signup-identifier" className="sr-only">E-mail ou CPF</label>
        <input
          id="signup-identifier"
          type="text"
          autoComplete="username"
          inputMode={identifierIsEmail ? 'email' : 'numeric'}
          placeholder="E-mail ou CPF"
          required={!isGestor}
          value={form.identifier}
          onChange={(e) => form.handleIdentifierChange(e.target.value)}
          onBlur={() => form.handleBlur('identifier')}
          aria-invalid={Boolean(form.fieldErrors.identifier)}
          aria-describedby="signup-identifier-feedback"
          className="w-full border rounded-lg p-3 text-sm"
        />
        <SignupFieldFeedback
          id="signup-identifier-feedback"
          error={form.fieldErrors.identifier}
          valid={!form.fieldErrors.identifier && form.identifier.trim().length > 0}
          validMessage={identifierIsEmail ? 'E-mail válido' : 'CPF válido'}
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="sr-only">Senha</label>
        <PasswordInput
          id="signup-password"
          name="password"
          placeholder="Senha (mínimo 8 caracteres)"
          autoComplete="new-password"
          required={!isGestor}
          minLength={isGestor ? undefined : 8}
          value={form.password}
          onChange={(e) => form.handlePasswordChange(e.target.value)}
          onBlur={() => form.handleBlur('password')}
          aria-invalid={Boolean(form.fieldErrors.password)}
          aria-describedby={form.fieldErrors.password ? 'signup-password-feedback' : undefined}
          className="p-3 text-sm"
        />
        <PasswordStrengthMeter password={form.password} />
        <SignupFieldFeedback id="signup-password-feedback" error={form.fieldErrors.password} />
      </div>

      <SignupRoleAndTerms
        role={form.role}
        setRole={form.setRole}
        termsAccepted={form.termsAccepted}
        setTermsAccepted={form.setTermsAccepted}
      />
    </>
  );
}
