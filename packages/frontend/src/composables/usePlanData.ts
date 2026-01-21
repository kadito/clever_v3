import { ref, computed } from 'vue';

interface PlanDetails {
  id: string;
  name: string;
  description: string;
  features: Array<{
    id: string;
    icon: string;
    text: string;
  }>;
  paymentOptions: Array<{
    id: string;
    period: string;
    amount: string;
  }>;
}

export function usePlanData() {
  const cpaPlans = ref<Record<string, PlanDetails>>({
    essential_care: {
      id: 'essential_care',
      name: 'ESSENTIAL CARE',
      description:
        'Assistência Remota: De Segunda a Sexta entre as 9:00 e as 19:00; Assistência Presencial: 1 (uma) manutenção/ano; Intervenções necessárias adicionais: € 150,00.',
      features: [
        { id: '1', icon: '🔧', text: '1 manutenções por ano' },
        { id: '2', icon: '📞', text: 'Intervenções necessárias adicionais deslocações' },
        { id: '3', icon: '🕘', text: 'De Segunda a Sexta entre as 9:00 e as 19:00' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '30,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '130,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '185,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '330,00 €' },
      ],
    },
    premium_care: {
      id: 'premium_care',
      name: 'PREMIUM CARE',
      description: 'Plano premium com mais benefícios e suporte estendido.',
      features: [
        { id: '1', icon: '🔧', text: '2 manutenções por ano' },
        { id: '2', icon: '📞', text: 'Suporte 24/7' },
        { id: '3', icon: '🚀', text: 'Resposta prioritária' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '50,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '180,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '280,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '500,00 €' },
      ],
    },
  });

  const shPlans = ref<Record<string, PlanDetails>>({
    simple: {
      id: 'simple',
      name: 'SIMPLE',
      description:
        'Pacote de 10:00/ano Duas deslocações/ano - Seg. a Sexta-Feira entre as 9:00 e as 19:00 Assistência Remota - Seg. a Sexta-Feira entre as 9:00 e as 23:00 Obs: A contabilização do tempo é efetuada por períodos de 15min.',
      features: [
        { id: '1', icon: '⏰', text: '10 horas por ano' },
        { id: '2', icon: '🚗', text: '2 deslocações incluídas' },
        { id: '3', icon: '🕘', text: 'Segunda a Sexta-Feira entre as 9:00 e as 23:00' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '30,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '130,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '330,00 €' },
      ],
    },
    brass: {
      id: 'brass',
      name: 'BRASS',
      description: 'Plano intermédio com mais horas e benefícios.',
      features: [
        { id: '1', icon: '⏰', text: '20 horas por ano' },
        { id: '2', icon: '🚗', text: '3 deslocações incluídas' },
        { id: '3', icon: '🕘', text: 'Suporte estendido' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '45,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '160,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '450,00 €' },
      ],
    },
    silver: {
      id: 'silver',
      name: 'SILVER',
      description: 'Plano silver com suporte de fim de semana.',
      features: [
        { id: '1', icon: '⏰', text: '10 horas por ano' },
        { id: '2', icon: '🚗', text: '2 deslocações incluídas' },
        { id: '3', icon: '📅', text: 'Suporte de fim de semana' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '45,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '185,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '270,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '495,00 €' },
      ],
    },
    gold: {
      id: 'gold',
      name: 'GOLD',
      description: 'Plano gold com mais horas e deslocações.',
      features: [
        { id: '1', icon: '⏰', text: '15 horas por ano' },
        { id: '2', icon: '🚗', text: '3 deslocações incluídas' },
        { id: '3', icon: '🕘', text: 'Segunda a Sexta-Feira entre as 9:00 e as 23:00' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '50,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '205,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '295,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '550,00 €' },
      ],
    },
    diamond: {
      id: 'diamond',
      name: 'DIAMOND',
      description: 'Plano diamond com suporte de sábado.',
      features: [
        { id: '1', icon: '⏰', text: '15 horas por ano' },
        { id: '2', icon: '🚗', text: '3 deslocações incluídas' },
        { id: '3', icon: '📅', text: 'Suporte aos sábados' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '55,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '220,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '325,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '605,00 €' },
      ],
    },
    platinum: {
      id: 'platinum',
      name: 'PLATINUM',
      description: 'Plano platinum com suporte completo de fim de semana.',
      features: [
        { id: '1', icon: '⏰', text: '15 horas por ano' },
        { id: '2', icon: '🚗', text: '3 deslocações incluídas' },
        { id: '3', icon: '📅', text: 'Suporte completo de fim de semana' },
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '65,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '260,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '380,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '715,00 €' },
      ],
    },
  });

  const getCPAPlan = (planId: string): PlanDetails | null => {
    return cpaPlans.value[planId] || null;
  };

  const getSHPlan = (planId: string): PlanDetails | null => {
    return shPlans.value[planId] || null;
  };

  return {
    cpaPlans: computed(() => cpaPlans.value),
    shPlans: computed(() => shPlans.value),
    getCPAPlan,
    getSHPlan,
  };
}
