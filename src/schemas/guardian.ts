import { z } from 'zod';
import { isMinor } from '@/core/access/age';

/** Grau de parentesco aceito no cadastro autônomo do responsável (A0.21). */
export const GUARDIAN_RELATIONSHIPS = ['PAI', 'MAE', 'TUTOR_LEGAL'] as const;

/** Tríade de consentimentos LGPD/ECA Digital: DATA é sempre obrigatório. */
export const GUARDIAN_CONSENT_PURPOSES = ['DATA', 'BROADCAST', 'STATS'] as const;

export const GuardianRelationshipSchema = z.enum(GUARDIAN_RELATIONSHIPS);
export const GuardianPurposeSchema = z.enum(GUARDIAN_CONSENT_PURPOSES);

/** Indicação de equipe técnica: entidade do pool (CT/treinador) ou convite externo. */
export const StaffIndicationSchema = z
  .object({
    kind: z.enum(['CT', 'COACH', 'EXTERNAL_COACH']),
    targetId: z.string().min(1).max(64).optional(),
    coachName: z.string().min(2).max(120).optional(),
    coachPhone: z.string().min(8).max(24).optional(),
  })
  .refine(
    (staff) =>
      staff.kind === 'EXTERNAL_COACH'
        ? Boolean(staff.coachName && staff.coachPhone)
        : Boolean(staff.targetId),
    { message: 'Selecione uma entidade do pool ou informe nome e WhatsApp do treinador.', path: ['targetId'] },
  );

/**
 * Payload aninhado enviado em `POST /api/auth/signup` quando `role: 'RESPONSAVEL'`.
 * A indicação de equipe técnica (Fase 2/4) usa `IndicateStaffRequestSchema` à parte,
 * após o auto-login do responsável.
 */
export const GuardianProfileSchema = z.object({
  accessMode: z.enum(['BASIC', 'SPECTATOR']),
  minorName: z.string().trim().min(3).max(120),
  minorBirthDate: z
    .string()
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()) && isMinor(value),
      'Informe a data de nascimento de um menor de 18 anos',
    ),
  minorCpf: z
    .string()
    .optional()
    .transform((value) => (value ? value.replace(/\D/g, '') : undefined)),
  relationship: GuardianRelationshipSchema,
  purposes: z
    .array(GuardianPurposeSchema)
    .min(1)
    .refine((purposes) => purposes.includes('DATA'), 'O consentimento DATA é obrigatório'),
  declaration: z.boolean().default(true),
  termsVersion: z.string().default('2.0'),
  contentHash: z.string().default('v2.0-initial-hash'),
});

/** Corpo de `POST /api/guardians/me/indicate-staff` (uso posterior, no painel). */
export const IndicateStaffRequestSchema = z.object({
  playerId: z.string().min(1),
  indication: StaffIndicationSchema,
});

export type GuardianProfileInput = z.infer<typeof GuardianProfileSchema>;
export type StaffIndicationInput = z.infer<typeof StaffIndicationSchema>;
export type GuardianRelationship = z.infer<typeof GuardianRelationshipSchema>;
export type GuardianPurpose = z.infer<typeof GuardianPurposeSchema>;
