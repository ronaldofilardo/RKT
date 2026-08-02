/**
 * TEMPLATE DE TESTE DE COMPONENTE — rkt
 * 
 * Copie este arquivo como base para testes de componentes React.
 * 
 * Owner: @qa
 * Status: Template oficial (Onda 1 — Guardrails)
 * 
 * INSTRUÇÕES:
 * 1. Copie para src/components/[Component]/__tests__/[Component].test.tsx
 * 2. Substitua [ComponentName], [componentName]
 * 3. Implemente casos de teste (render, interações, acessibilidade)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { [ComponentName] } from '../[ComponentName]';

describe('[ComponentName]', () => {
  const defaultProps = {
    children: 'Test Content',
    onClick: jest.fn(),
    disabled: false,
    variant: 'primary' as const,
    size: 'md' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o componente com children', () => {
      render(<[ComponentName] {...defaultProps}>Test Content</[ComponentName]>);
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('deve aplicar classes CSS corretas', () => {
      render(<[ComponentName] {...defaultProps} className="custom-class" />);
      
      const element = screen.getByRole('button');
      expect(element).toHaveClass('custom-class');
    });

    it('deve aplicar variante primary', () => {
      render(<[ComponentName] {...defaultProps} variant="primary" />);
      
      const element = screen.getByRole('button');
      expect(element).toHaveClass('bg-accent');
    });

    it('deve aplicar variante secondary', () => {
      render(<[ComponentName] {...defaultProps} variant="secondary" />);
      
      const element = screen.getByRole('button');
      expect(element).toHaveClass('bg-bg-2');
    });

    it('deve aplicar tamanho md', () => {
      render(<[ComponentName] {...defaultProps} size="md" />);
      
      const element = screen.getByRole('button');
      expect(element).toHaveClass('px-space-4', 'py-space-3');
    });
  });

  describe('Interações', () => {
    it('deve chamar onClick ao clicar', async () => {
      const onClick = jest.fn();
      render(<[ComponentName] {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('não deve chamar onClick quando desabilitado', async () => {
      const onClick = jest.fn();
      render(<[ComponentName] {...defaultProps} disabled onClick={onClick} />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(onClick).not.toHaveBeenCalled();
    });

    it('deve estar desabilitado visualmente', () => {
      render(<[ComponentName] {...defaultProps} disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(button).toBeDisabled();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter aria-disabled quando desabilitado', () => {
      render(<[ComponentName] {...defaultProps} disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('deve ser focável via teclado', () => {
      render(<[ComponentName] {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('deve ativar com Enter', async () => {
      const onClick = jest.fn();
      render(<[ComponentName] {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('deve ativar com Space', async () => {
      const onClick = jest.fn();
      render(<[ComponentName] {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Estados', () => {
    it('deve mostrar estado de loading', () => {
      render(<[ComponentName] {...defaultProps}>Carregando...</[ComponentName]>);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve mostrar estado de erro', () => {
      render(
        <[ComponentName] {...defaultProps} variant="outline">
          Erro ao carregar
        </[ComponentName]>
      );
      
      expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
    });
  });
});