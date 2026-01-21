import type { FormSection } from '@/components/common/types';

export const contractsFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais do contrato',
    fields: [
      {
        key: 'clientId',
        label: 'Cliente',
        type: 'custom',
        required: true,
        placeholder: 'Pesquisar cliente...',
      },
    ],
  },
  {
    key: 'contractTypes',
    title: 'Tipos de Contrato',
    description: 'Configuração dos contratos CPA e S&H com sistema de alternância de visualização',
    fields: [
      {
        key: 'contractTypes',
        label: 'Tipos de Contrato',
        type: 'custom',
        fullWidth: true,
      },
    ],
  },
  {
    key: 'additionalInfo',
    title: 'Informação Adicional',
    description: 'Configurações adicionais do contrato',
    fields: [
      {
        key: 'metodoPagamento',
        label: 'Método de Pagamento',
        type: 'custom',
        required: true,
        fullWidth: true,
      },
    ],
  },
];
