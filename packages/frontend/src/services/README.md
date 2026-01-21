# Plan Selection Service

Simple utility functions for handling contract plan filtering and selection
logic.

## Usage

### Direct Functions

```typescript
import {
  getAvailablePlans,
  requiresDistance,
  shouldShowPriceTable,
  getPlanDetails,
} from '../services/planSelection';

// Get available plans for a contract type
const cpaPlans = getAvailablePlans('CPA');
const cpa1500Plans = getAvailablePlans('CPA_1500');

// Check if distance is required
const needsDistance = requiresDistance('CPA_1500'); // false
const needsDistance = requiresDistance('CPA'); // true

// Determine if price table should be shown
const showTable = shouldShowPriceTable('CPA_1500', 'cpa_1500_essential'); // true
const showTable = shouldShowPriceTable('CPA', 'cpa_essential', 'under180km'); // true

// Get plan details
const planDetails = getPlanDetails('CPA', 'cpa_essential');
```

### Vue Composable

```typescript
import { usePlanSelection } from '../composables/usePlanSelection';

const {
  selectedContractType,
  availablePlans,
  planOptions,
  setContractType,
  setPlanId,
} = usePlanSelection();

// Set contract type (automatically clears plan selection)
setContractType('CPA_1500');
```

## Functions

- `getAvailablePlans(contractType)` - Returns plans for contract type
- `requiresDistance(contractType)` - Returns true if distance selection needed
- `shouldShowPriceTable(contractType, planId, distance?)` - Returns true if
  price table should show
- `getPlanDetails(contractType, planId)` - Returns specific plan details
- `getPlanOptions(contractType)` - Returns formatted options for dropdowns
