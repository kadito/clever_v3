import type { FormSection } from '@/components/common/types';

export const clientsFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais do cliente',
    fields: [
      {
        key: 'nomeEmpresa',
        label: 'Nome da Empresa',
        type: 'text',
        required: true,
        placeholder: 'Nome oficial da empresa',
      },
      {
        key: 'nomeComercial',
        label: 'Nome Comercial',
        type: 'text',
        required: true,
        placeholder: 'Nome comercial da empresa',
      },
      {
        key: 'contribuinte',
        label: 'Contribuinte',
        type: 'text',
        placeholder: '123456789',
      },
      {
        key: 'responsavel',
        label: 'Responsável',
        type: 'text',
        placeholder: 'Nome do responsável',
      },
    ],
  },
  {
    key: 'contact',
    title: 'Contactos',
    description: 'Informações de contacto',
    fields: [
      {
        key: 'telefone',
        label: 'Telefone',
        type: 'tel',
        placeholder: '+351 123 456 789',
      },
      {
        key: 'telefoneContato',
        label: 'Telefone do Contacto',
        type: 'tel',
        placeholder: '+351 987 654 321',
      },
      {
        key: 'email',
        label: 'E-mail',
        type: 'email',
        placeholder: 'empresa@exemplo.com',
      },
      {
        key: 'emailContato',
        label: 'E-mail do Contacto',
        type: 'email',
        placeholder: 'contacto@exemplo.com',
      },
    ],
  },
  {
    key: 'address',
    title: 'Morada',
    description: 'Endereço da empresa',
    fields: [
      {
        key: 'morada',
        label: 'Morada',
        type: 'textarea',
        rows: 3,
        fullWidth: true,
        placeholder: 'Rua, número, andar, etc.',
      },
      {
        key: 'codigoPostal',
        label: 'Código Postal',
        type: 'text',
        placeholder: '0000-000',
      },
      {
        key: 'localidade',
        label: 'Localidade',
        type: 'text',
        placeholder: 'Cidade',
      },
    ],
  },
  {
    key: 'financial',
    title: 'Informação Financeira',
    description: 'Dados bancários (opcional)',
    fields: [
      {
        key: 'iban',
        label: 'IBAN',
        type: 'text',
        fullWidth: true,
        placeholder: 'PT50 0000 0000 0000 0000 0000 0',
      },
    ],
  },
  {
    key: 'services',
    title: 'Serviços',
    description: 'Selecione os serviços contratados pelo cliente',
    fields: [
      {
        key: 'selectedServices',
        label: 'Serviços Contratados',
        type: 'multiselect',
        fullWidth: true,
        options: [
          { value: 'atcud', label: 'ATCUD' },
          { value: 'vectronConnect', label: 'Vectron Connect' },
          { value: 'temAnydesk', label: 'AnyDesk' },
          { value: 'manutencao', label: 'Manutenção' },
          { value: 'manutencao24', label: 'Manutenção 24h' },
          { value: 'dumps', label: 'DUMPS' },
        ],
        placeholder: 'Selecione os serviços...',
      },
    ],
  },
  {
    key: 'conditionalFields',
    title: 'Configurações Adicionais',
    description: 'Configurações específicas dos serviços selecionados',
    fields: [
      {
        key: 'atUsername',
        label: 'AT Username',
        type: 'text',
        placeholder: 'Username AT',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('atcud'),
        },
      },
      {
        key: 'atPassword',
        label: 'AT Password',
        type: 'text',
        placeholder: 'Password AT',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('atcud'),
        },
      },
      {
        key: 'vectronAddress',
        label: 'Vectron Address',
        type: 'text',
        fullWidth: true,
        placeholder: 'Ex: 192.168.1.100 ou vectron.empresa.com',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('vectronConnect'),
        },
      },
      {
        key: 'dumpsLink',
        label: 'Link Google Drive',
        type: 'url',
        fullWidth: true,
        placeholder: 'https://drive.google.com/...',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('dumps'),
        },
      },
      {
        key: 'seriesDocumentos',
        label: 'Séries de Documentos',
        type: 'text',
        placeholder: 'Ex: A, B, C',
        conditional: {
          dependsOn: 'selectedServices',
          showWhen: (value: any) => Array.isArray(value) && value.includes('atcud'),
        },
      },
    ],
  },
  {
    key: 'software',
    title: 'Software',
    description: 'Configure os softwares utilizados pelo cliente',
    fields: [
      {
        key: 'softwares',
        label: 'Softwares',
        type: 'custom',
        fullWidth: true,
      },
    ],
  },
  {
    key: 'observations',
    title: 'Observações',
    description: 'Notas adicionais sobre o cliente',
    fields: [
      {
        key: 'observacoes',
        label: 'Observações',
        type: 'textarea',
        rows: 4,
        fullWidth: true,
        placeholder: 'Notas adicionais sobre o cliente...',
      },
    ],
  },
];
