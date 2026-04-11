<template>
  <ContentDetailTemplate
    :item="client"
    :is-loading="isLoading"
    :error="error"
    back-route="/clients"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getClientTitle"
    :get-subtitle="getClientSubtitle"
    :get-status="getClientStatus"
    delete-button-text="Eliminar"
    confirm-delete-title="Confirmar Eliminação"
    confirm-delete-message="Tem a certeza que pretende eliminar este cliente?"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação Básica</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Nome da Empresa</label>
                  <div class="detail-value">{{ item.data.nomeEmpresa || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Nome Comercial</label>
                  <div class="detail-value">{{ item.data.nomeComercial || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Contribuinte</label>
                  <div class="detail-value">{{ item.data.contribuinte || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Responsável</label>
                  <div class="detail-value">{{ item.data.responsavel || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contract Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200"
               :class="{
                 'border-red-200 bg-red-50': contractIsError
               }">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
              :class="{
                'border-red-200 bg-red-100': contractIsError
              }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center flex-1 min-w-0">
                  <div class="flex-shrink-0 mr-3 text-gray-600"
                       :class="{ 'text-red-600': contractIsError }">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 class="text-lg font-semibold text-gray-900"
                      :class="{ 'text-red-900': contractIsError }">
                    Contrato
                  </h2>
                  <div v-if="contractIsError" class="ml-2">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <!-- Navigate to contract detail -->
                <router-link
                  v-if="hasContract && contractRelation"
                  :to="`/contracts/${contractRelation.uuid}`"
                  class="flex-shrink-0 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
                  style="min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;"
                  title="Ver detalhes do contrato"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </router-link>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <!-- Error state -->
              <div v-if="contractIsError" class="text-center py-2">
                <RelationInfoDisplay
                  :relation-data="contractRelation"
                  relation-type="contract"
                  custom-display-name="Contrato"
                />
              </div>

              <!-- Contract exists — show summary -->
              <div v-else-if="hasContract && contractRelation" class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Tipo de Contrato</label>
                  <div class="detail-value">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="cType in getContractTypes(contractRelation)"
                        :key="cType"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {{ cType }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="detail-item col-span-full">
                  <label class="detail-label">Plano(s)</label>
                  <div class="detail-value font-medium">{{ getContractPlanDisplay(contractRelation) }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Data Início</label>
                  <div class="detail-value">{{ getContractDates(contractRelation).start }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Data Fim</label>
                  <div class="detail-value">{{ getContractDates(contractRelation).end }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Estado</label>
                  <div class="detail-value">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getContractStatus(contractRelation).isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'"
                    >
                      {{ getContractStatus(contractRelation).label }}
                    </span>
                  </div>
                </div>
                <!-- Link to contract detail -->
                <div class="col-span-full mt-2">
                  <router-link
                    :to="`/contracts/${contractRelation.uuid}`"
                    class="inline-flex items-center justify-center w-full px-4 py-2 rounded-touch text-primary-700 font-medium border border-primary-300 bg-primary-50 hover:bg-primary-100 transition-colors"
                    style="min-height: 44px;"
                  >
                    Ver Contrato
                  </router-link>
                </div>
              </div>

              <!-- No contract -->
              <div v-else class="text-center py-4">
                <p class="text-gray-500 mb-4">Sem contrato ativo</p>
                <router-link
                  :to="`/contracts/create?clientId=${item.uuid}`"
                  class="inline-flex items-center justify-center px-4 py-2 rounded-touch text-white font-medium transition-colors hover:opacity-90"
                  style="background-color: #75AE93; min-height: 44px; min-width: 44px;"
                >
                  Criar Contrato
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Balance Section (All Users) -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch flex justify-between items-center"
            >
              <h2 class="text-lg font-semibold text-gray-900">Saldo</h2>
              <div class="flex gap-2">
                <button
                  v-if="permissions.canViewAuditTrail"
                  @click="handleRecalculateBalance"
                  class="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                  style="min-height: 44px; min-width: 44px;"
                  :disabled="isRecalculating"
                >
                  {{ isRecalculating ? 'A recalcular...' : 'Recalcular saldo' }}
                </button>
                <router-link
                  v-if="permissions.canViewAuditTrail"
                  :to="`/balance/${item.uuid}/transactions`"
                  class="text-sm text-primary-600 hover:text-primary-800 underline flex items-center"
                  style="min-height: 44px; min-width: 44px;"
                >
                  Ver Histórico
                </router-link>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <!-- Loading State -->
              <div v-if="isBalanceLoading" class="flex items-center justify-center py-4">
                <div class="balance-spinner"></div>
                <span class="ml-2 text-sm text-gray-500">A carregar saldo...</span>
              </div>

              <!-- Balance Display -->
              <div v-else class="detail-grid">
                <!-- Dívida -->
                <div class="detail-item">
                  <label class="detail-label">Dívida</label>
                  <div class="detail-value text-lg font-semibold" :class="balanceData.balance > 0 ? 'text-red-600' : 'text-gray-900'">
                    {{ balanceData.balance }}€
                  </div>
                </div>

                <!-- Manutenções restantes -->
                <div class="detail-item">
                  <label class="detail-label">Manutenções restantes</label>
                  <div
                    class="detail-value text-lg font-semibold px-2 py-1 rounded"
                    :class="isResourceLow('manutencoesPorAno') ? 'bg-yellow-50 text-yellow-800 border border-yellow-400' : ''"
                  >
                    <span>{{ formatResourceValue(balanceData.contracts.manutencoesPorAno) }}</span>
                    <span v-if="isResourceLow('manutencoesPorAno')" class="ml-1">⚠️</span>
                  </div>
                </div>

                <!-- Deslocações restantes -->
                <div class="detail-item">
                  <label class="detail-label">Deslocações restantes</label>
                  <div
                    class="detail-value text-lg font-semibold px-2 py-1 rounded"
                    :class="isResourceLow('deslocacoesPorAno') ? 'bg-yellow-50 text-yellow-800 border border-yellow-400' : ''"
                  >
                    <span>{{ formatResourceValue(balanceData.contracts.deslocacoesPorAno) }}</span>
                    <span v-if="isResourceLow('deslocacoesPorAno')" class="ml-1">⚠️</span>
                  </div>
                </div>

                <!-- Horas restantes -->
                <div class="detail-item">
                  <label class="detail-label">Horas restantes</label>
                  <div
                    class="detail-value text-lg font-semibold px-2 py-1 rounded"
                    :class="isResourceLow('horasAssistenciaAnuais') ? 'bg-yellow-50 text-yellow-800 border border-yellow-400' : ''"
                  >
                    <span>{{ formatResourceValue(balanceData.contracts.horasAssistenciaAnuais) }}</span>
                    <span v-if="isResourceLow('horasAssistenciaAnuais')" class="ml-1">⚠️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Contactos</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Telefone</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.telefone"
                      :href="`tel:${item.data.telefone}`"
                      class="contact-link"
                    >
                      {{ item.data.telefone }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Telefone do Contacto</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.telefoneContato"
                      :href="`tel:${item.data.telefoneContato}`"
                      class="contact-link"
                    >
                      {{ item.data.telefoneContato }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">E-mail</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.email"
                      :href="`mailto:${item.data.email}`"
                      class="contact-link"
                    >
                      {{ item.data.email }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">E-mail do Contacto</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.emailContato"
                      :href="`mailto:${item.data.emailContato}`"
                      class="contact-link"
                    >
                      {{ item.data.emailContato }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Address Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Morada</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item col-span-full">
                  <label class="detail-label">Morada</label>
                  <div class="detail-value whitespace-pre-line">{{ item.data.morada || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Código Postal</label>
                  <div class="detail-value">{{ item.data.codigoPostal || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Localidade</label>
                  <div class="detail-value">{{ item.data.localidade || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Information Section -->
        <div v-if="item.data.iban" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação Financeira</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item col-span-full">
                  <label class="detail-label">IBAN</label>
                  <div class="detail-value font-mono">{{ item.data.iban }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Services Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Serviços</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="services-grid">
                <div class="service-item">
                  <label class="service-label">AnyDesk</label>
                  <div class="service-status" :class="{ active: item.data.temAnydesk }">
                    {{ item.data.temAnydesk ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">Manutenção</label>
                  <div class="service-status" :class="{ active: item.data.manutencao }">
                    {{ item.data.manutencao ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">Manutenção 24h</label>
                  <div class="service-status" :class="{ active: item.data.manutencao24 }">
                    {{ item.data.manutencao24 ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">DUMPS</label>
                  <div class="service-status" :class="{ active: item.data.dumps }">
                    {{ item.data.dumps ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">ATCUD</label>
                  <div class="service-status" :class="{ active: item.data.atcud }">
                    {{ item.data.atcud ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">Vectron Connect</label>
                  <div class="service-status" :class="{ active: item.data.vectronConnect }">
                    {{ item.data.vectronConnect ? 'Sim' : 'Não' }}
                  </div>
                </div>
              </div>

              <!-- Conditional service fields -->
              <div
                v-if="hasConditionalFields(item.data)"
                class="mt-6 pt-6 border-t border-gray-200"
              >
                <h3 class="text-sm font-semibold text-gray-900 mb-4">Configurações Adicionais</h3>
                <div class="detail-grid">
                  <!-- DUMPS Link -->
                  <div
                    v-if="item.data.dumps && item.data.dumpsLink"
                    class="detail-item col-span-full"
                  >
                    <label class="detail-label">Link Google Drive</label>
                    <div class="detail-value">
                      <a :href="item.data.dumpsLink" target="_blank" class="contact-link">
                        {{ item.data.dumpsLink }}
                      </a>
                    </div>
                  </div>

                  <!-- ATCUD Fields -->
                  <template v-if="item.data.atcud">
                    <div v-if="item.data.seriesDocumentos" class="detail-item">
                      <label class="detail-label">Séries de Documentos</label>
                      <div class="detail-value">{{ item.data.seriesDocumentos }}</div>
                    </div>
                    <div v-if="item.data.atUsername" class="detail-item">
                      <label class="detail-label">AT Username</label>
                      <div class="detail-value">{{ item.data.atUsername }}</div>
                    </div>
                    <div v-if="item.data.atPassword" class="detail-item">
                      <label class="detail-label">AT Password</label>
                      <div class="detail-value flex items-center space-x-2">
                        <span class="font-mono">
                          {{ showATPassword ? item.data.atPassword : '••••••••' }}
                        </span>
                        <button
                          @click="toggleATPassword"
                          class="password-toggle-btn"
                          :title="showATPassword ? 'Ocultar password' : 'Mostrar password'"
                        >
                          <svg
                            v-if="showATPassword"
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L9.878 9.878m4.242 4.242L8.464 8.464"
                            />
                          </svg>
                          <svg
                            v-else
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </template>

                  <!-- Vectron Connect Address -->
                  <div
                    v-if="item.data.vectronConnect && item.data.vectronAddress"
                    class="detail-item col-span-full"
                  >
                    <label class="detail-label">Vectron Address</label>
                    <div class="detail-value font-mono">{{ item.data.vectronAddress }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Software Section -->
        <div v-if="item.data.softwares && item.data.softwares.length > 0" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Software</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="space-y-4">
                <div
                  v-for="(software, index) in item.data.softwares"
                  :key="software.id"
                  class="software-card"
                >
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-base font-semibold text-gray-900">
                      {{ software.name }}
                      <span v-if="software.product" class="text-sm font-normal text-gray-600">
                        - {{ software.product }}
                      </span>
                    </h3>
                    <span class="software-badge">{{ Number(index) + 1 }}</span>
                  </div>

                  <div class="detail-grid">
                    <!-- Vectron-specific fields -->
                    <template v-if="software.name === 'Vectron'">
                      <div v-if="software.model" class="detail-item">
                        <label class="detail-label">Modelo</label>
                        <div class="detail-value">{{ software.model }}</div>
                      </div>
                      <div v-if="software.nEquipamento" class="detail-item">
                        <label class="detail-label">Nº Equipamento</label>
                        <div class="detail-value">{{ software.nEquipamento }}</div>
                      </div>
                      <div v-if="software.versaoSoftware" class="detail-item">
                        <label class="detail-label">Versão do Software</label>
                        <div class="detail-value">{{ software.versaoSoftware }}</div>
                      </div>
                    </template>

                    <!-- Pix-specific fields -->
                    <template v-else-if="software.name === 'Pix'">
                      <div
                        v-if="software.modules && software.modules.length > 0"
                        class="detail-item col-span-full"
                      >
                        <label class="detail-label">Módulos</label>
                        <div class="detail-value">
                          <div class="flex flex-wrap gap-1">
                            <span
                              v-for="module in software.modules"
                              :key="module"
                              class="module-badge"
                            >
                              {{ module }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Zone Soft-specific fields -->
                    <template v-else-if="software.name === 'Zone Soft'">
                      <div v-if="software.version" class="detail-item">
                        <label class="detail-label">Versão</label>
                        <div class="detail-value">{{ software.version }}</div>
                      </div>
                    </template>

                    <!-- Pt CERT-specific fields -->
                    <template v-else-if="software.name === 'Pt CERT'">
                      <div v-if="software.licenseType" class="detail-item">
                        <label class="detail-label">Tipo de Licença</label>
                        <div class="detail-value">{{ software.licenseType }}</div>
                      </div>
                    </template>

                    <!-- Common fields (for all except Vectron) -->
                    <template v-if="software.name !== 'Vectron'">
                      <div v-if="software.numeroSerie" class="detail-item">
                        <label class="detail-label">Número Série</label>
                        <div class="detail-value">{{ software.numeroSerie }}</div>
                      </div>
                      <div v-if="software.versaoSoftware" class="detail-item">
                        <label class="detail-label">Versão Software</label>
                        <div class="detail-value">{{ software.versaoSoftware }}</div>
                      </div>
                      <div v-if="software.versaoLicenca" class="detail-item">
                        <label class="detail-label">Versão Licença</label>
                        <div class="detail-value">{{ software.versaoLicenca }}</div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Observations Section -->
        <div v-if="item.data.observacoes" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Observações</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-value whitespace-pre-line">{{ item.data.observacoes }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :is-open="showDeleteConfirm"
    :title="confirmDeleteTitle"
    :message="confirmDeleteMessage"
    :is-loading="isDeleting"
    confirm-text="Confirmar"
    cancel-text="Cancelar"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
    @close="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Client, BaseContent, ContentWithRelations } from '@clever/shared';
import { isRelationError, isResolvedRelation } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import RelationInfoDisplay from '@/components/common/RelationInfoDisplay.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { usePermissions } from '@/composables/usePermissions';
import contractPlansConfig from '@/config/contract-plans.json';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<Client>('clients');
const errorHandler = useErrorHandler();
const { permissions } = usePermissions();

// State
const client = ref<Client | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const balanceKey = ref(0); // Key to force balance component refresh

// AT Password visibility toggle
const showATPassword = ref(false);

// Delete state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Recalculation state
const isRecalculating = ref(false);

// Balance state
const isBalanceLoading = ref(false);
const balanceData = ref({
  balance: 0,
  contracts: {
    manutencoesPorAno: 0,
    deslocacoesPorAno: 0,
    horasAssistenciaAnuais: 0,
  },
});
const initialResources = ref({
  manutencoesPorAno: 0,
  deslocacoesPorAno: 0,
  horasAssistenciaAnuais: 0,
});

// Clear error function
const clearError = () => {
  error.value = null;
};

// Display functions for ContentDetailTemplate
const getClientTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Cliente';
  const client = item as Client;
  return client.data.nomeComercial || client.data.nomeEmpresa || 'Cliente';
};

const getClientSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const client = item as Client;
  const parts = [];

  if (client.data.contribuinte) {
    parts.push(`NIF: ${client.data.contribuinte}`);
  }

  if (client.data.localidade) {
    parts.push(client.data.localidade);
  }

  return parts.join(' • ');
};

const getClientStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Cliente';
  const client = item as Client;
  const services = [];

  if (client.data.manutencao24) services.push('Manutenção 24h');
  else if (client.data.manutencao) services.push('Manutenção');

  if (client.data.temAnydesk) services.push('AnyDesk');
  if (client.data.atcud) services.push('ATCUD');

  return services.join(', ') || 'Cliente Ativo';
};

// Helper functions
const hasConditionalFields = (data: any): boolean => {
  return (
    (data.dumps && data.dumpsLink) ||
    (data.atcud && (data.seriesDocumentos || data.atUsername || data.atPassword)) ||
    (data.vectronConnect && data.vectronAddress)
  );
};

// Contract helper functions
const getPlanName = (contractType: string, planId: string): string => {
  const config = contractPlansConfig as any;
  const typeConfig = config[contractType];
  if (!typeConfig || !typeConfig.plans) return planId;
  const plan = typeConfig.plans.find((p: any) => p.id === planId);
  return plan?.name || planId;
};

const clientWithRelations = computed(() => {
  return client.value as (Client & { relations?: Record<string, any> }) | null;
});

const contractRelation = computed(() => {
  const relations = (clientWithRelations.value as any)?.relations;
  if (!relations) return undefined;
  return relations.contract;
});

const hasContract = computed(() => {
  return contractRelation.value && isResolvedRelation(contractRelation.value);
});

const contractIsError = computed(() => {
  return contractRelation.value && isRelationError(contractRelation.value);
});

const getContractTypes = (contract: any): string[] => {
  const types: string[] = [];
  if (contract.hasCPAContract) types.push('CPA');
  if (contract.hasSHContract) types.push('S&H');
  return types;
};

const getContractPlanDisplay = (contract: any): string => {
  const parts: string[] = [];
  if (contract.hasCPAContract && contract.cpaContractType && contract.planIdCPA) {
    const planName = getPlanName(contract.cpaContractType, contract.planIdCPA);
    parts.push(`CPA: ${planName}`);
  }
  if (contract.hasSHContract && contract.planIdSH) {
    const planName = getPlanName('S&H', contract.planIdSH);
    parts.push(`S&H: ${planName}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '-';
};

const getContractDates = (contract: any): { start: string; end: string } => {
  let start = '';
  let end = '';

  if (contract.hasCPAContract && contract.inicioContratoCPA) {
    start = formatDate(contract.inicioContratoCPA);
    end = contract.fimContratoCPA ? formatDate(contract.fimContratoCPA) : '';
  }
  if (contract.hasSHContract && contract.inicioContratoSH) {
    if (!start) start = formatDate(contract.inicioContratoSH);
    if (!end && contract.fimContratoSH) end = formatDate(contract.fimContratoSH);
  }

  return { start: start || '-', end: end || '-' };
};

const getContractStatus = (contract: any): { label: string; isActive: boolean } => {
  const now = new Date();
  let endDate: Date | null = null;

  if (contract.hasCPAContract && contract.fimContratoCPA) {
    endDate = new Date(contract.fimContratoCPA);
  }
  if (contract.hasSHContract && contract.fimContratoSH) {
    const shEnd = new Date(contract.fimContratoSH);
    if (!endDate || shEnd > endDate) endDate = shEnd;
  }

  if (!endDate) return { label: 'Ativo', isActive: true };
  return endDate >= now
    ? { label: 'Ativo', isActive: true }
    : { label: 'Expirado', isActive: false };
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Toggle AT Password visibility
const toggleATPassword = () => {
  showATPassword.value = !showATPassword.value;
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const client = item as Client;
  router.push(`/clients/${client.uuid}/editar`);
};

const handleBack = () => {
  router.push('/clients');
};

// Delete functionality
const getDeleteConfirmationMessage = (): string => {
  if (!client.value) return 'Tem a certeza que pretende eliminar este cliente?';

  const clientName =
    client.value.data.nomeComercial || client.value.data.nomeEmpresa || 'este cliente';
  return `Tem a certeza que pretende eliminar "${clientName}"? Esta ação não pode ser desfeita.`;
};

const handleDelete = () => {
  if (!client.value) return;

  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!client.value) return;

  try {
    isDeleting.value = true;

    console.log(
      'Attempting to delete client:',
      JSON.stringify(
        {
          uuid: client.value.uuid,
          name: client.value.data.nomeComercial || client.value.data.nomeEmpresa,
        },
        null,
        2
      )
    );

    const success = await api.remove(client.value.uuid);

    // Check if API returned an error
    if (api.error.value) {
      console.error('API returned error:', JSON.stringify(api.error.value, null, 2));
      error.value =
        typeof api.error.value === 'string'
          ? api.error.value
          : api.error.value.message || 'Erro ao eliminar cliente';
      showDeleteConfirm.value = false;
      return;
    }

    if (success) {
      console.log('Client deleted successfully, navigating to /clients');
      // Navigate to clients list after successful deletion
      router.push('/clients');
    } else {
      console.error('Delete operation failed - useApi returned false');
      error.value = 'Não foi possível eliminar este cliente.';
      showDeleteConfirm.value = false;
    }
  } catch (err) {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao eliminar cliente';
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Balance display helpers
const formatResourceValue = (value: number): string => {
  if (value === -1) return 'Ilimitado';
  return value.toString();
};

const isResourceLow = (field: 'manutencoesPorAno' | 'deslocacoesPorAno' | 'horasAssistenciaAnuais'): boolean => {
  const current = balanceData.value.contracts[field];
  const initial = initialResources.value[field];

  // Unlimited (-1) never shows warning
  if (current === -1 || initial === -1) return false;
  // Zero initial means no contract resources — no warning
  if (initial === 0) return false;

  const percentageRemaining = (current / initial) * 100;
  return percentageRemaining < 20;
};

// Load balance data
const loadBalance = (clientId: string) => {
  isBalanceLoading.value = true;

  fetch(`/api/balance/${clientId}`)
    .then(async (response) => {
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          // No balance or no permission — show zeros
          console.log('Balance not available:', response.status);
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao carregar saldo');
      }
      return response.json();
    })
    .then((data) => {
      if (data && data.data) {
        console.log('Balance loaded:', JSON.stringify(data.data, null, 2));
        balanceData.value = {
          balance: data.data.balance ?? 0,
          contracts: {
            manutencoesPorAno: data.data.contracts?.manutencoesPorAno ?? 0,
            deslocacoesPorAno: data.data.contracts?.deslocacoesPorAno ?? 0,
            horasAssistenciaAnuais: data.data.contracts?.horasAssistenciaAnuais ?? 0,
          },
        };
        // Store initial resources for low-usage calculation
        initialResources.value = {
          manutencoesPorAno: data.data.contracts?.manutencoesPorAno ?? 0,
          deslocacoesPorAno: data.data.contracts?.deslocacoesPorAno ?? 0,
          horasAssistenciaAnuais: data.data.contracts?.horasAssistenciaAnuais ?? 0,
        };
      }
    })
    .catch((err) => {
      console.error('Error loading balance:', JSON.stringify(err, null, 2));
      // On error, keep zeros — don't show error to user
    })
    .finally(() => {
      isBalanceLoading.value = false;
    });
};

// Balance recalculation
const handleRecalculateBalance = async () => {
  if (!client.value) return;

  const confirmed = window.confirm(
    'Tem a certeza que pretende recalcular o saldo deste cliente? Esta operação irá recalcular o saldo a partir de todas as transações.'
  );

  if (!confirmed) return;

  isRecalculating.value = true;
  error.value = null;

  // Get auth token
  const token = await window.Clerk?.session?.getToken();

  await fetch(`/api/balance/${client.value.uuid}/recalculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao recalcular saldo');
      }
      return response.json();
    })
    .then(data => {
      console.log('Balance recalculated:', JSON.stringify(data, null, 2));
      // Refresh inline balance display
      if (client.value) {
        loadBalance(client.value.uuid);
      }
      balanceKey.value++;
      alert('Saldo recalculado com sucesso!');
    })
    .catch(err => {
      console.error('Error recalculating balance:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao recalcular saldo';
    })
    .finally(() => {
      isRecalculating.value = false;
    });
};

// Data loading
const loadClient = async () => {
  const clientId = route.params.uuid as string;

  if (!clientId) {
    error.value = 'ID do cliente não fornecido';
    return;
  }

  try {
    isLoading.value = true;
    clearError();

    await api.fetchById(clientId);

    if (api.currentItem.value) {
      client.value = api.currentItem.value;
      // Load balance data for the client
      loadBalance(clientId);
    } else {
      throw new Error('Cliente não encontrado');
    }
  } catch (err) {
    console.error('Error loading client:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar cliente';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadClient();
});
</script>

<style scoped>
/* Client-specific styling */
.software-card {
  @apply p-4 bg-gray-50 rounded-touch border border-gray-200;
}

/* Balance loading spinner */
.balance-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e5e7eb;
  border-top-color: #75AE93;
  border-radius: 50%;
  animation: balance-spin 0.8s linear infinite;
}

@keyframes balance-spin {
  to { transform: rotate(360deg); }
}

.software-badge {
  @apply px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium;
}

.module-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium;
}

.services-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-4;
}

.service-item {
  @apply flex flex-col space-y-1;
}

.service-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.service-status {
  @apply text-sm font-medium text-gray-600;
}

.service-status.active {
  @apply text-green-600;
}

.contact-link {
  @apply text-primary-600 hover:text-primary-800 underline;
}

/* Detail grid responsive adjustments */
.detail-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .detail-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .detail-grid {
    @apply grid-cols-3;
  }
}

.detail-item {
  @apply space-y-1;
}

.detail-item.col-span-full {
  grid-column: 1 / -1;
}

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 break-words;
}

/* Portuguese text optimization */
.detail-value,
.service-status,
.software-badge,
.module-badge {
  @apply text-portuguese;
}

/* Password toggle button */
.password-toggle-btn {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center;
}

.password-toggle-btn:hover {
  @apply bg-gray-100;
}

.password-toggle-btn:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

.password-toggle-btn:active {
  @apply bg-gray-200;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .services-grid {
    @apply grid-cols-1;
  }

  .software-card {
    @apply p-3;
  }
}

/* Print styles */
@media print {
  .software-card {
    @apply border border-gray-300 bg-white;
  }

  .contact-link {
    @apply text-black no-underline;
  }
}
</style>
