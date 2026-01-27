import type { FormSection } from '@/components/common/types';

/**
 * Form sections configuration for Daily Activity Records
 *
 * Note: The Activities section uses ActivityCard components for dynamic
 * activity management rather than traditional form fields. Each activity
 * is managed through its own ActivityCard component with add/edit/remove
 * functionality.
 *
 * Requirements:
 * - 1.1: Date field (dataRegistro) is required
 * - 2.1: Activities are managed dynamically through ActivityCard components
 */
export const dailyRecordsFormSections: FormSection[] = [
  {
    key: 'general',
    title: 'Informação Geral',
    description: 'Data do registo de atividade diária',
    fields: [
      {
        key: 'dataRegistro',
        label: 'Data do Registo',
        type: 'date',
        required: true,
        fullWidth: false,
        placeholder: 'Selecione a data',
        defaultValue: new Date().toISOString().split('T')[0],
        helpText: 'Data em que as atividades foram realizadas',
      },
    ],
  },
  {
    key: 'activities',
    title: 'Atividades',
    description: 'Adicione e gerencie as atividades realizadas durante o dia',
    fields: [
      // Activities are managed through ActivityCard components
      // Not traditional form fields - handled dynamically in create/update views
      // Each activity includes:
      // - tipoAtividade (Interno/Externo)
      // - assunto (subject)
      // - horaInicio, horaFim, tempoPausa (time tracking)
      // - totalHoras (calculated automatically)
      // - descricao (optional description)
      // - tipoLigacao (Nenhuma/Folha de Obra/Assistência Remota)
      // - workSheetId or remoteAssistanceId (conditional based on tipoLigacao)
    ],
  },
];
