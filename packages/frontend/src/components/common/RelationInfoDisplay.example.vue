<template>
  <div class="relation-examples">
    <h1 class="text-2xl font-bold mb-6">
      RelationInfoDisplay Component Examples
    </h1>

    <!-- Example 1: Successful client relation -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        1. Successful Client Relation
      </h2>
      <RelationInfoDisplay
        :relation-data="successfulClientRelation"
        relation-type="client"
        relation-id="client-123"
      />
    </section>

    <!-- Example 2: Client relation with error (404) -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        2. Client Relation Error (404)
      </h2>
      <RelationInfoDisplay
        :relation-data="clientRelationError404"
        relation-type="client"
        relation-id="invalid-client-id"
      />
    </section>

    <!-- Example 3: Client relation with server error (500) -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        3. Client Relation Error (500)
      </h2>
      <RelationInfoDisplay
        :relation-data="clientRelationError500"
        relation-type="client"
        relation-id="client-456"
      />
    </section>

    <!-- Example 4: Missing client relation (null) -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        4. Missing Client Relation
      </h2>
      <RelationInfoDisplay
        :relation-data="null"
        relation-type="client"
      />
    </section>

    <!-- Example 5: Contract relation -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        5. Contract Relation
      </h2>
      <RelationInfoDisplay
        :relation-data="successfulContractRelation"
        relation-type="contract"
        relation-id="contract-789"
      />
    </section>

    <!-- Example 6: Custom display name and fields -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        6. Custom Display Name and Fields
      </h2>
      <RelationInfoDisplay
        :relation-data="successfulClientRelation"
        relation-type="client"
        custom-display-name="Cliente Associado"
        :custom-fields="customFields"
        relation-id="client-123"
      />
    </section>

    <!-- Example 7: With debug info -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        7. With Debug Information
      </h2>
      <RelationInfoDisplay
        :relation-data="successfulClientRelation"
        relation-type="client"
        relation-id="client-123"
        :show-debug-info="true"
      />
    </section>

    <!-- Integration Example -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">
        8. Integration Example (License Detail View)
      </h2>
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="font-medium mb-2">
          Before (Manual Client Section):
        </h3>
        <pre
          class="text-sm bg-white p-3 rounded border overflow-x-auto"
        ><code>&lt;!-- Manual client information section --&gt;
&lt;div v-if="clientInfo" class="detail-section"&gt;
  &lt;div class="bg-white rounded-touch border border-gray-200"&gt;
    &lt;div class="px-4 py-3 border-b border-gray-200 bg-gray-50"&gt;
      &lt;h2 class="text-lg font-semibold text-gray-900"&gt;Informação do Cliente&lt;/h2&gt;
    &lt;/div&gt;
    &lt;div class="p-4"&gt;
      &lt;div class="detail-grid"&gt;
        &lt;div class="detail-item"&gt;
          &lt;label class="detail-label"&gt;Nome da Empresa&lt;/label&gt;
          &lt;div class="detail-value"&gt;{{ clientInfo.nomeEmpresa || '-' }}&lt;/div&gt;
        &lt;/div&gt;
        &lt;!-- More manual fields... --&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

        <h3 class="font-medium mb-2 mt-4">
          After (Using RelationInfoDisplay):
        </h3>
        <pre
          class="text-sm bg-white p-3 rounded border overflow-x-auto"
        ><code>&lt;!-- Automatic relation display --&gt;
&lt;RelationInfoDisplay
  :relation-data="license?.relations?.client"
  relation-type="client"
  :relation-id="license?.data?.clientId"
/&gt;</code></pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RelationInfoDisplay from './RelationInfoDisplay.vue';
import type { ResolvedRelation, RelationError } from '@clever/shared';

// Example data
const successfulClientRelation: ResolvedRelation = {
  uuid: 'client-123',
  contentType: 'clients',
  nomeEmpresa: 'Empresa ABC Lda',
  nomeComercial: 'ABC Comercial',
  contribuinte: '123456789',
  localidade: 'Lisboa',
  telefoneContato: '+351 21 123 4567',
  emailContato: 'geral@empresaabc.pt',
};

const clientRelationError404: RelationError = {
  type: 'error',
  code: 404,
  message: 'Not found',
};

const clientRelationError500: RelationError = {
  type: 'error',
  code: 500,
  message: 'Internal Server Error',
};

const successfulContractRelation: ResolvedRelation = {
  uuid: 'contract-789',
  contentType: 'contracts',
  numeroContrato: 'CT-2024-001',
  dataInicio: '2024-01-01T00:00:00.000Z',
  dataFim: '2024-12-31T23:59:59.000Z',
  valor: '1500.00',
};

const customFields = [
  { key: 'nomeEmpresa', label: 'Empresa' },
  { key: 'contribuinte', label: 'Número Fiscal' },
  { key: 'telefoneContato', label: 'Contacto' },
];
</script>

<style scoped>
.relation-examples {
  @apply max-w-4xl mx-auto p-6;
}

section {
  @apply border-b border-gray-200 pb-6;
}

section:last-child {
  @apply border-b-0;
}

pre {
  @apply whitespace-pre-wrap;
}

code {
  @apply text-xs;
}
</style>
