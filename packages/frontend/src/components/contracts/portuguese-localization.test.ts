import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DisplayToggleSwitch from './DisplayToggleSwitch.vue'
import CPAContractSection from './CPAContractSection.vue'
import SHContractSection from './SHContractSection.vue'
import ContractDatesSection from './ContractDatesSection.vue'
import CPAEquipmentManager from './CPAEquipmentManager.vue'
import EquipmentCard from './EquipmentCard.vue'
import DynamicPlanDetails from './DynamicPlanDetails.vue'

describe('Portuguese Localization Verification', () => {
  describe('DisplayToggleSwitch', () => {
    it('displays Portuguese titles correctly', () => {
      const wrapper = mount(DisplayToggleSwitch, {
        props: {
          title: 'CPA - CASHLOGY',
          isActive: true
        }
      })
      
      expect(wrapper.text()).toContain('CPA - CASHLOGY')
    })
  })

  describe('CPAContractSection', () => {
    const mockFormData = {
      cpaContractType: '',
      planIdCPA: '',
      distanceCPA: '',
      inicioContratoCPA: '',
      fimContratoCPA: ''
    }

    it('displays Portuguese labels correctly', () => {
      const wrapper = mount(CPAContractSection, {
        props: {
          formData: mockFormData,
          cpaEquipments: [],
          selectedPlanDetails: null
        }
      })
      
      expect(wrapper.text()).toContain('TIPO DE CONTRATO CPA')
      expect(wrapper.text()).toContain('PLANO CPA')
      expect(wrapper.text()).toContain('DISTÂNCIA')
      expect(wrapper.text()).toContain('Selecione o tipo...')
      expect(wrapper.text()).toContain('Selecione o plano...')
      expect(wrapper.text()).toContain('Selecione a distância...')
      expect(wrapper.text()).toContain('CPA - Cashlogy (2023)')
      expect(wrapper.text()).toContain('CPA - Cashlogy (1500)')
      expect(wrapper.text()).toContain('Menos de 180 km')
      expect(wrapper.text()).toContain('Mais de 180 km')
    })

    it('displays loading text in Portuguese', () => {
      const wrapper = mount(CPAContractSection, {
        props: {
          formData: mockFormData,
          cpaEquipments: [],
          selectedPlanDetails: null,
          isLoadingPlan: true
        }
      })
      
      expect(wrapper.text()).toContain('A carregar detalhes do plano...')
    })
  })

  describe('SHContractSection', () => {
    const mockFormData = {
      planIdSH: '',
      distanceSH: '',
      modeloPSO: '',
      numeroSeriePSO: '',
      softwarePSO: '',
      inicioContratoSH: '',
      fimContratoSH: ''
    }

    it('displays Portuguese labels correctly', () => {
      const wrapper = mount(SHContractSection, {
        props: {
          formData: mockFormData,
          selectedPlanDetails: null,
          shEquipments: []
        }
      })
      
      expect(wrapper.text()).toContain('PLANO S&H')
      expect(wrapper.text()).toContain('DISTÂNCIA')
      expect(wrapper.text()).toContain('EQUIPAMENTOS S&H')
      expect(wrapper.text()).toContain('ADICIONAR EQUIPAMENTO')
      expect(wrapper.text()).toContain('Selecione o plano...')
      expect(wrapper.text()).toContain('Selecione a distância...')
      expect(wrapper.text()).toContain('Menos de 180 km')
      expect(wrapper.text()).toContain('Mais de 180 km')
    })

    it('displays Portuguese equipment management correctly', () => {
      const mockEquipments = [
        {
          id: '1',
          modelo: 'Dell Optiplex 7090',
          numeroSerie: 'ABC123456',
          software: 'Windows 11 Pro',
          observacoes: 'Test equipment'
        }
      ]

      const wrapper = mount(SHContractSection, {
        props: {
          formData: mockFormData,
          selectedPlanDetails: null,
          shEquipments: mockEquipments
        }
      })
      
      // Check that equipment cards are rendered with Portuguese labels
      expect(wrapper.findAllComponents({ name: 'SHEquipmentCard' })).toHaveLength(1)
      expect(wrapper.text()).toContain('EQUIPAMENTOS S&H')
      expect(wrapper.text()).toContain('ADICIONAR EQUIPAMENTO')
    })
  })

  describe('ContractDatesSection', () => {
    it('displays Portuguese date labels correctly', () => {
      const wrapper = mount(ContractDatesSection, {
        props: {
          startDate: '',
          endDate: ''
        }
      })
      
      expect(wrapper.text()).toContain('DATAS DO CONTRATO')
      expect(wrapper.text()).toContain('DATA DE INÍCIO')
      expect(wrapper.text()).toContain('DATA DE FIM')
    })
  })

  describe('CPAEquipmentManager', () => {
    it('displays Portuguese equipment labels correctly', () => {
      const wrapper = mount(CPAEquipmentManager, {
        props: {
          equipments: []
        }
      })
      
      expect(wrapper.text()).toContain('EQUIPAMENTOS CPA')
      expect(wrapper.text()).toContain('+ ADICIONAR EQUIPAMENTO')
      expect(wrapper.text()).toContain('O desconto aplica-se apenas aos equipamentos adicionais (2º, 3º, etc.). O primeiro equipamento não tem desconto.')
    })
  })

  describe('EquipmentCard', () => {
    const mockEquipment = {
      id: '1',
      modelo: '',
      numeroSerie: '',
      desconto: 0,
      observacoes: ''
    }

    it('displays Portuguese equipment card labels correctly', () => {
      const wrapper = mount(EquipmentCard, {
        props: {
          equipment: mockEquipment,
          equipmentNumber: 1,
          showDiscount: false
        }
      })
      
      expect(wrapper.text()).toContain('EQUIPAMENTO 1')
      expect(wrapper.text()).toContain('MODELO')
      expect(wrapper.text()).toContain('Nº SÉRIE')
      expect(wrapper.text()).toContain('OBSERVAÇÕES')
    })

    it('displays Portuguese placeholders correctly', () => {
      const wrapper = mount(EquipmentCard, {
        props: {
          equipment: mockEquipment,
          equipmentNumber: 1,
          showDiscount: false
        }
      })
      
      const modelInput = wrapper.find('input[placeholder="Ex: GEST 15"]')
      const serialInput = wrapper.find('input[placeholder="Ex: 1234567"]')
      const observationsTextarea = wrapper.find('textarea[placeholder="Observações sobre este equipamento..."]')
      
      expect(modelInput.exists()).toBe(true)
      expect(serialInput.exists()).toBe(true)
      expect(observationsTextarea.exists()).toBe(true)
    })

    it('displays discount label in Portuguese when shown', () => {
      const wrapper = mount(EquipmentCard, {
        props: {
          equipment: mockEquipment,
          equipmentNumber: 2,
          showDiscount: true
        }
      })
      
      expect(wrapper.text()).toContain('DESCONTO (%)')
    })
  })

  describe('DynamicPlanDetails', () => {
    const mockPlanDetails = {
      name: 'ESSENTIAL CARE',
      description: 'Assistência Remota: De Segunda a Sexta entre as 9:00 e as 19:00',
      maintenancePerYear: 1,
      hoursPerYear: null,
      callouts: 'Intervenções necessárias adicionais: € 150,00',
      displacementsIncluded: null,
      remoteSupport: 'De Segunda a Sexta entre as 9:00 e as 19:00',
      weekendSupport: false,
      prices: {
        under180km: {
          monthly: 30,
          quarterly: 130,
          semiannual: 185,
          annual: 330
        }
      }
    }

    it('displays Portuguese payment selection header correctly', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: mockPlanDetails,
          selectedPayment: '',
          distance: 'under180km'
        }
      })
      
      expect(wrapper.text()).toContain('SELECIONE A MODALIDADE DE PAGAMENTO:')
    })

    it('displays Portuguese payment periods correctly', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: mockPlanDetails,
          selectedPayment: '',
          distance: 'under180km'
        }
      })
      
      expect(wrapper.text()).toContain('MENSAL')
      expect(wrapper.text()).toContain('TRIMESTRAL')
      expect(wrapper.text()).toContain('SEMESTRAL')
      expect(wrapper.text()).toContain('ANUAL')
    })

    it('displays Portuguese feature text correctly', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: mockPlanDetails,
          selectedPayment: '',
          distance: 'under180km'
        }
      })
      
      expect(wrapper.text()).toContain('manutenções por ano')
    })

    it('formats prices in Portuguese locale', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: mockPlanDetails,
          selectedPayment: '',
          distance: 'under180km'
        }
      })
      
      // Check that prices are formatted with Euro symbol (the actual format may vary)
      const text = wrapper.text()
      expect(text).toMatch(/30[,.]00\s*€/)
      expect(text).toMatch(/130[,.]00\s*€/)
      expect(text).toMatch(/185[,.]00\s*€/)
      expect(text).toMatch(/330[,.]00\s*€/)
    })
  })

  describe('Form Configuration Portuguese Text', () => {
    it('verifies Portuguese text in form sections configuration', async () => {
      // Import the configuration using dynamic import
      const { contractsFormSections } = await import('@/config/contracts-form-sections')
      
      // Check section titles
      const basicSection = contractsFormSections.find((s: any) => s.key === 'basic')
      expect(basicSection?.title).toBe('Informação Básica')
      expect(basicSection?.description).toBe('Dados fundamentais do contrato')
      
      const clientInfoSection = contractsFormSections.find((s: any) => s.key === 'clientInfo')
      expect(clientInfoSection?.title).toBe('Informação do Cliente')
      expect(clientInfoSection?.description).toBe('Dados do cliente selecionado (apenas leitura)')
      
      const contractTypesSection = contractsFormSections.find((s: any) => s.key === 'contractTypes')
      expect(contractTypesSection?.title).toBe('Tipos de Contrato')
      expect(contractTypesSection?.description).toBe('Configuração dos contratos CPA e S&H com sistema de alternância de visualização')
      
      const additionalInfoSection = contractsFormSections.find((s: any) => s.key === 'additionalInfo')
      expect(additionalInfoSection?.title).toBe('Informação Adicional')
      expect(additionalInfoSection?.description).toBe('Configurações adicionais do contrato')
    })

    it('verifies Portuguese field labels', async () => {
      const { contractsFormSections } = await import('@/config/contracts-form-sections')
      
      // Check client field
      const basicSection = contractsFormSections.find((s: any) => s.key === 'basic')
      const clientField = basicSection?.fields.find((f: any) => f.key === 'clientId')
      expect(clientField?.label).toBe('Cliente')
      expect(clientField?.placeholder).toBe('Pesquisar cliente...')
      
      // Note: CPA and S&H field labels are now handled by their respective components
      // (CPAContractSection and SHContractSection) rather than form configuration
      // This test verifies the basic form structure is in Portuguese
      const contractTypesSection = contractsFormSections.find((s: any) => s.key === 'contractTypes')
      const contractTypesField = contractTypesSection?.fields.find((f: any) => f.key === 'contractTypes')
      expect(contractTypesField?.label).toBe('Tipos de Contrato')
      
      // Check payment method field
      const additionalInfoSection = contractsFormSections.find((s: any) => s.key === 'additionalInfo')
      const paymentField = additionalInfoSection?.fields.find((f: any) => f.key === 'metodoPagamento')
      expect(paymentField?.label).toBe('Método de Pagamento')
    })

    it('verifies Portuguese option labels', async () => {
      // Note: Option labels are now handled by the individual components
      // (CPAContractSection and SHContractSection) rather than form configuration
      // This test verifies that the components use Portuguese labels
      
      // The actual Portuguese labels are tested in the component-specific tests
      // This test just ensures the form configuration structure is correct
      const { contractsFormSections } = await import('@/config/contracts-form-sections')
      
      const contractTypesSection = contractsFormSections.find((s: any) => s.key === 'contractTypes')
      expect(contractTypesSection).toBeDefined()
      expect(contractTypesSection?.fields).toHaveLength(1)
      expect(contractTypesSection?.fields[0].type).toBe('custom')
    })
  })
})