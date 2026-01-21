import type { FormSection } from '@/components/common/types';

export const licensesFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais da licença',
    fields: [
      {
        key: 'clientId',
        label: 'Cliente',
        type: 'custom',
        required: true,
        placeholder: 'Pesquisar cliente...',
      },
      {
        key: 'versao',
        label: 'Versão',
        type: 'text',
        placeholder: 'Ex: 2024.1',
      },
      {
        key: 'numeroSerie',
        label: 'Número de Série',
        type: 'text',
        placeholder: 'Número de série da licença',
      },
    ],
  },
  {
    key: 'period',
    title: 'Período da Licença',
    description: 'Datas e modalidade da licença',
    fields: [
      {
        key: 'dataInicio',
        label: 'Data de Início',
        type: 'date',
      },
      {
        key: 'dataVencimento',
        label: 'Data de Vencimento',
        type: 'date',
      },
      {
        key: 'modalidade',
        label: 'Modalidade',
        type: 'select',
        options: [
          { value: 'ANUAL', label: 'Anual' },
          { value: 'SEMESTRAL', label: 'Semestral' },
          { value: 'TRIMESTRAL', label: 'Trimestral' },
          { value: 'MENSAL', label: 'Mensal' },
        ],
        placeholder: 'Selecione a modalidade...',
      },
      {
        key: 'duracaoContrato',
        label: 'Duração do Contrato',
        type: 'text',
        placeholder: 'Ex: 12 meses',
      },
    ],
  },
  {
    key: 'software',
    title: 'Software',
    description: 'Configure os softwares da licença',
    fields: [
      {
        key: 'software',
        label: 'Software',
        type: 'custom',
        fullWidth: true,
      },
    ],
  },
  {
    key: 'invoices',
    title: 'Faturas',
    description: 'Informações de faturação',
    fields: [
      {
        key: 'invoices',
        label: 'Faturas',
        type: 'custom',
        fullWidth: true,
      },
    ],
  },
];
