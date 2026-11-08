interface SignupFieldFeedbackProps {
  id: string;
  error?: string;
  valid?: boolean;
  validMessage?: string;
}

export function SignupFieldFeedback({ id, error, valid, validMessage }: SignupFieldFeedbackProps) {
  if (error) {
    return (
      <p id={id} className="mt-1 text-xs font-medium text-telemetry-error flex items-center gap-1">
        <span aria-hidden="true">✕</span>
        {error}
      </p>
    );
  }

  if (!valid || !validMessage) return null;

  return (
    <p id={id} className="mt-1 text-xs font-medium text-telemetry-volt flex items-center gap-1">
      <span aria-hidden="true">✓</span>
      {validMessage}
    </p>
  );
}
