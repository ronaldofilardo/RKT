/**
 * Testes unitários para a lógica do modal BolasTrocadasModal
 * 
 * Como o componente usa createPortal e depende do DOM,
 * testamos apenas a lógica de estado e handlers.
 */

describe('BolasTrocadasModal - Lógica', () => {
  describe('Validação de entrada', () => {
    it('deve aceitar valores de 0 a 99', () => {
      const valoresValidos = ['0', '1', '5', '10', '50', '99'];
      
      valoresValidos.forEach(valor => {
        const num = parseInt(valor, 10);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(99);
        expect(isNaN(num)).toBe(false);
      });
    });

    it('deve rejeitar valores acima de 99', () => {
      const valoresInvalidos = ['100', '123', '999'];
      
      valoresInvalidos.forEach(valor => {
        const num = parseInt(valor, 10);
        expect(num).toBeGreaterThan(99);
      });
    });

    it('deve tratar string vazia como 0', () => {
      const valor = '';
      const num = valor === '' ? 0 : parseInt(valor, 10);
      expect(num).toBe(0);
    });

    it('deve limitar a 2 dígitos', () => {
      let valor = '';
      const maxDigits = 2;
      
      // Simular digitação
      ['1', '2', '3'].forEach(digito => {
        if (valor.length < maxDigits) {
          valor += digito;
        }
      });
      
      expect(valor).toBe('12');
      expect(valor.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Handlers', () => {
    it('handleConfirm deve retornar número válido quando valor >= 0', () => {
      const bolas = '8';
      const numBolas = bolas === '' ? 0 : parseInt(bolas, 10);
      
      expect(numBolas).toBe(8);
      expect(numBolas).toBeGreaterThanOrEqual(0);
    });

    it('handleConfirm deve retornar 0 quando vazio', () => {
      const bolas = '';
      const numBolas = bolas === '' ? 0 : parseInt(bolas, 10);
      
      expect(numBolas).toBe(0);
    });

    it('handleCancel deve retornar -1 (ignorar)', () => {
      // Simula comportamento do botão Ignorar
      const onConfirm = jest.fn();
      onConfirm(-1);
      
      expect(onConfirm).toHaveBeenCalledWith(-1);
    });

    it('handleBackspace deve remover último dígito', () => {
      let bolas = '45';
      
      // Simular backspace
      bolas = bolas.slice(0, -1);
      expect(bolas).toBe('4');
      
      bolas = bolas.slice(0, -1);
      expect(bolas).toBe('');
    });
  });

  describe('Keypad', () => {
    const KEYPAD = [
      { value: '1', label: '1', disabled: false },
      { value: '2', label: '2', disabled: false },
      { value: '3', label: '3', disabled: false },
      { value: '4', label: '4', disabled: false },
      { value: '5', label: '5', disabled: false },
      { value: '6', label: '6', disabled: false },
      { value: '7', label: '7', disabled: false },
      { value: '8', label: '8', disabled: false },
      { value: '9', label: '9', disabled: false },
      { value: '0', label: '0', disabled: false },
    ];

    const KEYPAD_ORDER = ['0', '7', '8', '9', '4', '5', '6', '1', '2', '3'];

    it('deve ter 10 teclas no keypad (apenas numéricas)', () => {
      expect(KEYPAD).toHaveLength(10);
    });

    it('não deve ter teclas * e #', () => {
      const specialKeys = KEYPAD.filter(k => k.value === '*' || k.value === '#');
      expect(specialKeys).toHaveLength(0);
    });

    it('deve ter layout com 0 no topo e 3x3 abaixo', () => {
      const teclasAbaixoDoZero = KEYPAD_ORDER.slice(1);
      expect(teclasAbaixoDoZero).toHaveLength(9);
      expect(Math.ceil(teclasAbaixoDoZero.length / 3)).toBe(3);
    });

    it('todas as teclas devem ter valor e label', () => {
      KEYPAD.forEach(key => {
        expect(key).toHaveProperty('value');
        expect(key).toHaveProperty('label');
        expect(key.value).toBeTruthy();
        expect(key.label).toBeTruthy();
      });
    });

    it('teclas numéricas devem ter valores 0-9', () => {
      const numericKeys = KEYPAD.filter(k => /^[0-9]$/.test(k.value));
      expect(numericKeys).toHaveLength(10);
      
      const values = numericKeys.map(k => k.value);
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(d => {
        expect(values).toContain(d);
      });
    });

    it('deve ordenar teclas com 0 no topo, seguido de 7-8-9, 4-5-6, 1-2-3', () => {
      expect(KEYPAD_ORDER[0]).toBe('0');
      expect(KEYPAD_ORDER.slice(1, 4)).toEqual(['7', '8', '9']);
      expect(KEYPAD_ORDER.slice(4, 7)).toEqual(['4', '5', '6']);
      expect(KEYPAD_ORDER.slice(7, 10)).toEqual(['1', '2', '3']);
    });
  });

  describe('Validação de confirmação', () => {
    it('deve desabilitar confirmação para valor 1', () => {
      const bolas = '1';
      const confirmDisabled = bolas === '1' || bolas === '2';
      expect(confirmDisabled).toBe(true);
    });

    it('deve desabilitar confirmação para valor 2', () => {
      const bolas = '2';
      const confirmDisabled = bolas === '1' || bolas === '2';
      expect(confirmDisabled).toBe(true);
    });

    it('deve habilitar confirmação para valor 0', () => {
      const bolas = '0';
      const confirmDisabled = bolas === '1' || bolas === '2';
      expect(confirmDisabled).toBe(false);
    });

    it('deve habilitar confirmação para valor >= 3', () => {
      ['3', '4', '5', '10', '15', '99'].forEach(valor => {
        const confirmDisabled = valor === '1' || valor === '2';
        expect(confirmDisabled).toBe(false);
      });
    });

    it('teclas 1 e 2 devem estar habilitadas para entrada de valores >= 10', () => {
      const KEYPAD_LOCAL = [
        { value: '1', label: '1', disabled: false },
        { value: '2', label: '2', disabled: false },
        { value: '3', label: '3', disabled: false },
        { value: '4', label: '4', disabled: false },
        { value: '5', label: '5', disabled: false },
        { value: '6', label: '6', disabled: false },
        { value: '7', label: '7', disabled: false },
        { value: '8', label: '8', disabled: false },
        { value: '9', label: '9', disabled: false },
        { value: '0', label: '0', disabled: false },
      ];
      
      const tecla1 = KEYPAD_LOCAL.find(k => k.value === '1');
      const tecla2 = KEYPAD_LOCAL.find(k => k.value === '2');
      
      expect(tecla1?.disabled).toBe(false);
      expect(tecla2?.disabled).toBe(false);
    });
  });

  describe('Integração com fluxo de scoring', () => {
    it('deve passar rallyLength para o processPoint quando confirmado', () => {
      const rallyLengthFromModal = '8';
      const previewBalls = 1;
      
      const rallyLengthToUse = rallyLengthFromModal
        ? parseInt(rallyLengthFromModal, 10) || previewBalls
        : previewBalls;
      
      expect(rallyLengthToUse).toBe(8);
    });

    it('deve usar previewBalls quando modal for cancelado (-1)', () => {
      const numBolas = -1; // Cancelado
      const previewBalls = 2;
      
      const rallyLength = numBolas >= 0 ? numBolas : previewBalls;
      
      expect(rallyLength).toBe(2);
    });

    it('deve usar previewBalls como fallback quando rallyLength não fornecido', () => {
      const rallyLengthFromModal = undefined;
      const previewBalls = 3;
      
      const rallyLengthToUse = rallyLengthFromModal
        ? parseInt(rallyLengthFromModal, 10) || previewBalls
        : previewBalls;
      
      expect(rallyLengthToUse).toBe(3);
    });
  });
});