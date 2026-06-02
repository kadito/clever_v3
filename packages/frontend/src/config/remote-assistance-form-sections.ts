import type { FormSection } from '@/components/common/types';

export const remoteAssistanceFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Dados do Cliente',
    description: 'Informação básica do cliente para a assistência remota',
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
    key: 'assistanceInfo',
    title: 'Informação da Assistência',
    description: 'Detalhes sobre o tipo de assistência',
    fields: [
      {
        key: 'tipoAssistencia',
        label: 'Tipo de Assistência',
        type: 'select',
        required: true,
        fullWidth: false,
        options: [
          { value: '', label: 'Selecionar tipo...' },
          { value: 'REMOTA', label: 'REMOTA' },
          { value: 'TELEFÓNICA', label: 'TELEFÓNICA' },
        ],
      },
    ],
  },
  {
    key: 'dateTime',
    title: 'Data e Horário',
    description: 'Datas e horários da assistência remota',
    fields: [
      {
        key: 'dataPedido',
        label: 'Data do Pedido',
        type: 'date',
        required: true,
        fullWidth: false,
        defaultValue: new Date().toISOString().split('T')[0],
      },
      {
        key: 'dataAssistencia',
        label: 'Data da Assistência',
        type: 'date',
        required: true,
        fullWidth: false,
        defaultValue: new Date().toISOString().split('T')[0],
      },
      {
        key: 'inicioAssistencia',
        label: 'Início da Assistência',
        type: 'custom',
        required: true,
        fullWidth: false,
        placeholder: '09:00',
      },
      {
        key: 'fimAssistencia',
        label: 'Fim da Assistência',
        type: 'custom',
        required: true,
        fullWidth: false,
        placeholder: '10:00',
      },
      {
        key: 'horasTotais',
        label: 'Horas Totais',
        type: 'custom',
        fullWidth: false,
        disabled: true,
        placeholder: 'Calculado automaticamente',
      },
    ],
  },
  {
    key: 'description',
    title: 'Descrição',
    description: 'Motivo do pedido e relatório da assistência',
    fields: [
      {
        key: 'motivoPedido',
        label: 'Motivo do Pedido',
        type: 'textarea',
        fullWidth: true,
        rows: 3,
        placeholder: 'Descreva o motivo do pedido...',
      },
      {
        key: 'relatorioAssistencia',
        label: 'Relatório da Assistência',
        type: 'textarea',
        fullWidth: true,
        rows: 4,
        placeholder: 'Descreva o que foi realizado durante a assistência...',
      },
    ],
  },

  {
    key: 'status',
    title: 'Estado',
    description: 'Estado da assistência',
    fields: [
      {
        key: 'resolvido',
        label: 'Resolvido',
        type: 'switch',
        required: true,
        fullWidth: false,
        switchLabel: 'Problema foi resolvido',
        defaultValue: false,
      },
      {
        key: 'relatorio',
        label: 'Relatório Final',
        type: 'textarea',
        fullWidth: true,
        rows: 3,
        placeholder: 'Relatório final da assistência não resolvida...',
        conditional: {
          dependsOn: 'resolvido',
          showWhen: (value: any) => value === false,
        },
        conditionalRequired: {
          dependsOn: 'resolvido',
          requiredWhen: (value: any) => value === false,
        },
      },
    ],
  },
  {
    key: 'payment',
    title: 'Método de Pagamento',
    description: 'Forma de pagamento da assistência',
    fields: [
      {
        key: 'paymentMethod',
        label: 'Método de Pagamento',
        type: 'custom',
        required: true,
        fullWidth: true,
      },
      {
        key: 'contractId',
        label: 'Contrato',
        type: 'custom',
        required: false,
        fullWidth: true,
        conditional: {
          dependsOn: 'paymentMethod',
          showWhen: (value: any) => value === 'Contrato',
        },
        conditionalRequired: {
          dependsOn: 'paymentMethod',
          requiredWhen: (value: any) => value === 'Contrato',
        },
      },
    ],
  },
  {
    key: 'observations',
    title: 'Anexos',
    description: 'Ficheiros e notas adicionais',
    fields: [
      {
        key: 'anexosFiles',
        label: 'Anexos',
        type: 'custom',
        fullWidth: true,
      },
      {
        key: 'anexos',
        label: 'Notas Anexos',
        type: 'textarea',
        fullWidth: true,
        rows: 2,
        placeholder: 'Notas adicionais sobre anexos ou documentos relacionados...',
      },
    ],
  },
];
