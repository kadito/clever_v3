import { ref, computed, type Ref } from 'vue';
import {
  getAvailablePlans,
  getPlanOptions,
  getPlanDetails,
  requiresDistance,
  shouldShowPriceTable,
  type ContractType,
} from '../services/planSelection';

/**
 * Composable for handling plan selection logic in Vue components
 */
export function usePlanSelection() {
  const selectedContractType: Ref<ContractType | ''> = ref('');
  const selectedPlanId: Ref<string> = ref('');
  const selectedDistance: Ref<string> = ref('');

  const availablePlans = computed(() => getAvailablePlans(selectedContractType.value));
  const planOptions = computed(() => getPlanOptions(selectedContractType.value));
  const selectedPlanDetails = computed(() => {
    if (!selectedContractType.value || !selectedPlanId.value) return null;
    return getPlanDetails(selectedContractType.value, selectedPlanId.value);
  });
  const planRequiresDistance = computed(() => requiresDistance(selectedContractType.value));
  const showPriceTable = computed(() =>
    shouldShowPriceTable(selectedContractType.value, selectedPlanId.value, selectedDistance.value)
  );

  const setContractType = (contractType: ContractType | '') => {
    selectedContractType.value = contractType;
    selectedPlanId.value = ''; // Clear plan when contract type changes
    selectedDistance.value = '';
  };

  return {
    selectedContractType,
    selectedPlanId,
    selectedDistance,
    availablePlans,
    planOptions,
    selectedPlanDetails,
    requiresDistance: planRequiresDistance,
    shouldShowPriceTable: showPriceTable,
    setContractType,
    setPlanId: (planId: string) => {
      selectedPlanId.value = planId;
    },
    setDistance: (distance: string) => {
      selectedDistance.value = distance;
    },
  };
}
