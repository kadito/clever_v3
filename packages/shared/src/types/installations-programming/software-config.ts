// ── Software Hierarchy Configuration ────────────────────────────────

export interface SoftwareHierarchy {
  brand: string;
  subProducts?: {
    name: string;
    modules?: string[];
    tiers?: string[];
  }[];
  licenseTypes?: string[];
}

export interface SoftwareSelection {
  brand: string;
  subProduct?: string;
  module?: string;
  tier?: string;
  licenseType?: string;
}

export const SOFTWARE_HIERARCHY: readonly SoftwareHierarchy[] = [
  { brand: 'Vectron' },
  {
    brand: 'Pix',
    subProducts: [
      { name: 'Pix Rest', modules: ['Modulo 1', 'Modulo 2', 'Modulo 3', 'Posto adicional'] },
      { name: 'Pix Gest', modules: ['Modulo 1', 'Modulo 2', 'Modulo 3', 'Posto adicional'] },
      { name: 'Pix POS', modules: ['Modulo 1', 'Modulo 2', 'Modulo 3', 'Posto adicional'] },
      { name: 'Pix AutoVenda', modules: ['Modulo 1', 'Modulo 2', 'Modulo 3', 'Posto adicional'] },
    ],
  },
  { brand: 'Pix Orders' },
  { brand: 'Pix Order Posto Adicional' },
  { brand: 'Pix Monitor Pedidos' },
  { brand: 'Pix RestFest' },
  {
    brand: 'Zon Soft',
    subProducts: [
      { name: 'ZS Rest', tiers: ['Basic', 'Light', 'Pro'] },
      { name: 'ZS POS', tiers: ['Basic', 'Light', 'Pro'] },
    ],
  },
  { brand: 'Zon Soft Mobile' },
  { brand: 'PT CERT', licenseTypes: ['Licença definitiva', 'Licença Atual'] },
  { brand: 'Dream Soft' },
  { brand: 'Contas Certas' },
] as const;

/**
 * Validates a software selection against the SOFTWARE_HIERARCHY config.
 * Returns false if selection is null or incomplete for the brand's requirements.
 */
export function validateSoftwareSelection(selection: SoftwareSelection | null): boolean {
  if (!selection) {
    return false;
  }

  const hierarchy = SOFTWARE_HIERARCHY.find((h) => h.brand === selection.brand);
  if (!hierarchy) {
    return false;
  }

  // Brand has license types (e.g. PT CERT)
  if (hierarchy.licenseTypes) {
    if (!selection.licenseType || !hierarchy.licenseTypes.includes(selection.licenseType)) {
      return false;
    }
  }

  // Brand has sub-products (e.g. Pix, Zon Soft)
  if (hierarchy.subProducts) {
    if (!selection.subProduct) {
      return false;
    }

    const subProduct = hierarchy.subProducts.find((sp) => sp.name === selection.subProduct);
    if (!subProduct) {
      return false;
    }

    // Sub-product has modules (e.g. Pix sub-products)
    if (subProduct.modules) {
      if (!selection.module || !subProduct.modules.includes(selection.module)) {
        return false;
      }
    }

    // Sub-product has tiers (e.g. Zon Soft sub-products)
    if (subProduct.tiers) {
      if (!selection.tier || !subProduct.tiers.includes(selection.tier)) {
        return false;
      }
    }
  }

  return true;
}
