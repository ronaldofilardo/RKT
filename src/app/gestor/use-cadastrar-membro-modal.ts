import { useState, useEffect } from 'react';
import type { MemberType, CadastroResult } from './cadastrar-membro-confirm-modal';
import type { MembroFormData } from './cadastrar-membro-form';
import { submitMemberApi } from './cadastrar-membro.logic';

export interface ExistingLinkInfo {
  name: string;
  accountKind?: string;
  guardianName?: string;
  message?: string;
  canLink?: boolean;
}

const initialForm: MembroFormData = { name: '', cpf: '', birthDate: '', email: '', gender: 'MASCULINO', dominance: 'DESTRO' };

export function useCadastrarMembroModal(
  onSave: (result: CadastroResult) => void,
  onOpenChange: (open: boolean) => void,
  initialType: MemberType = 'TREINADOR',
  fixedType?: MemberType,
) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<CadastroResult | null>(null);
  const [existingToLink, setExistingToLink] = useState<ExistingLinkInfo | null>(null);
  const [type, setType] = useState<MemberType>(fixedType ?? initialType);
  const [formData, setFormData] = useState<MembroFormData>(initialForm);

  useEffect(() => { if (fixedType) setType(fixedType); }, [fixedType]);

  async function submitMember(linkExisting = false) {
    setError(null);
    setFieldError(null);
    if (!formData.name.trim() || !formData.cpf.trim() || !formData.birthDate) {
      setError('Nome, CPF e data de nascimento são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      const { ok, data } = await submitMemberApi(type, formData, linkExisting);
      if (!ok) {
        if (data.canLinkExisting || data.accountKind) {
          setExistingToLink({
            name: data.existingUserName || formData.name,
            accountKind: data.accountKind,
            guardianName: data.guardianName,
            message: data.message,
            canLink: data.canLinkExisting !== false,
          });
          return;
        }
        throw new Error(data.message || 'Falha ao cadastrar membro');
      }
      const result: CadastroResult = {
        userId: data.userId, tempPassword: data.tempPassword, linkExpiresAt: data.linkExpiresAt,
        type, isExistingUser: data.isExistingUser, isMinor: data.isMinor, guardianName: data.guardianName,
      };
      setConfirmResult(result);
      onSave(result);
      setFormData(initialForm);
      setExistingToLink(null);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível salvar.';
      const match = msg.match(/^([a-zA-Z]+):/);
      setFieldError(match ? match[1] : null);
      setError(msg);
    } finally { setSubmitting(false); }
  }

  return {
    submitting, error, fieldError, confirmResult, setConfirmResult,
    existingToLink, setExistingToLink, type, setType, formData, setFormData, submitMember,
  };
}
