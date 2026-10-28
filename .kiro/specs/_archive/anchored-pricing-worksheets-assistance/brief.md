# Anchored Pricing for Worksheets & Remote Assistance

## Summary

When creating Folhas de Obra (Work Sheets) and Assistências Remotas (Remote Assistance) records, the system must calculate and store the price using the CURRENT pricing at the moment of creation. After creation, the stored (anchored) price becomes immutable — it is never recalculated from updated rates.

The Detail view must compute/display the price from this anchored value, not from the current pricing configuration.

## Key Concepts

- **Price anchoring**: Snapshot the applicable price at creation time and persist it with the record
- **Immutability after creation**: Once stored, the price does not change even if pricing configuration is updated later
- **Detail view computation**: Use the anchored price (not current rates) when displaying pricing in the detail view

## Content Types Affected

- Folhas de Obra (Work Sheets)
- Assistências Remotas (Remote Assistance)
