# Pricing Update (Worksheets & Remote Assistance) — Tests

## [MI] — Strategy

| Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|-----------|-----------|--------------------------|---------------------|--------|
| `calculateWorkSheetPricing()` | unit | Weekday rate €55, weekend rate €70, min 1h rule, 180km threshold (≤180=€45, >180=€60), mileage at €0.45/km, missing times → zeroed, overnight wrap-around, displacement disabled → no travel/mileage | None (pure function) | PRICE-AC-001, AC-002, AC-003, AC-004, AC-005, AC-012, BR-001–BR-005, BR-009, BR-011 |
| `calculateRemoteAssistancePricing()` | unit | Business hours only (€45/h), off-hours only (€60/h), lunch gap crossing (12:30 split), afternoon boundary (14:30 split), full-day crossing all boundaries, weekend → all off-hours, 15-min rounding, Contrato/Garantia → zero cost, missing times → zeroed | None (pure function) | PRICE-AC-006, AC-007, AC-008, AC-009, AC-011, BR-006–BR-010, BR-012 |
| `WORK_SHEET_CONSTANTS` | unit | All values match spec (€55, €70, €0.45, €45, €60, 180km, 1h, 23%) | None | PRICE-BR-001–BR-005, BR-009 |
| `REMOTE_ASSISTANCE_CONSTANTS` | unit | All values match spec (€45/h, €60/h, 09:00-12:30, 14:30-18:00, 15min, 23%) | None | PRICE-BR-006–BR-010 |
| Work Sheet Views (pricing display) | integration | Pricing section visible without displacement, displacement costs conditional, rates from constants, total updates reactively | `calculateWorkSheetPricing` (real), DOM rendering | PRICE-UX-003, UX-004 |
| Remote Assistance Views (pricing display) | integration | Pricing note shows new text "€45/hora (09:00-12:30, 14:30-18:00) \| €60/hora (outras horas) + IVA", breakdown labels correct, zero-cost notice on Contrato/Garantia | `calculateRemoteAssistancePricing` (real), DOM rendering | PRICE-UX-001, UX-002, AC-010 |
| Backend index extraction (WS) | unit | `extractIndexFields` calls `calculateWorkSheetPricing` and stores correct breakdown fields | R2 storage (mocked) | PRICE-BR-001–BR-005 |
| Backend index extraction (RA) | unit | `extractIndexFields` calls `calculateRemoteAssistancePricing` and stores correct value fields | R2 storage (mocked) | PRICE-BR-006–BR-008 |

## [MI] — Test Plan (IDs)

### MI-01: WORK_SHEET_CONSTANTS values
- `HOURLY_RATE_WEEKDAY` === 55.0
- `HOURLY_RATE_WEEKEND_HOLIDAY` === 70.0
- `MILEAGE_RATE_PER_KM` === 0.45
- `TRAVEL_FEE_SHORT` === 45.0
- `TRAVEL_FEE_LONG` === 60.0
- `TRAVEL_FEE_THRESHOLD_KM` === 180
- `MINIMUM_HOURS` === 1
- `IVA_RATE` === 0.23

### MI-02: calculateWorkSheetPricing — weekday rate
- Input: weekendHoliday=false, arrivalTime="09:00", departureTime="11:00"
- Expected: hourlyRate=55, laborHours=2, laborPrice=110

### MI-03: calculateWorkSheetPricing — weekend rate
- Input: weekendHoliday=true, arrivalTime="09:00", departureTime="11:00"
- Expected: hourlyRate=70, laborHours=2, laborPrice=140

### MI-04: calculateWorkSheetPricing — minimum 1 hour
- Input: weekendHoliday=false, arrivalTime="10:00", departureTime="10:30"
- Expected: laborHours=1, laborPrice=55

### MI-05: calculateWorkSheetPricing — displacement ≤180km
- Input: hasDisplacement=true, totalKms=180
- Expected: travelFee=45, mileagePrice=81 (180×0.45)

### MI-06: calculateWorkSheetPricing — displacement >180km
- Input: hasDisplacement=true, totalKms=200
- Expected: travelFee=60, mileagePrice=90 (200×0.45)

### MI-07: calculateWorkSheetPricing — no displacement
- Input: hasDisplacement=false, totalKms=100
- Expected: travelFee=0, mileagePrice=0

### MI-08: calculateWorkSheetPricing — missing times
- Input: arrivalTime="", departureTime=""
- Expected: all zeroed result

### MI-09: calculateWorkSheetPricing — overnight wrap-around
- Input: arrivalTime="22:00", departureTime="02:00"
- Expected: laborHours=4, hourlyRate applied correctly

### MI-10: REMOTE_ASSISTANCE_CONSTANTS values
- `PRICE_BUSINESS_HOURS` === 45.0
- `PRICE_AFTER_HOURS` === 60.0
- `BUSINESS_HOURS_MORNING_START` === 540
- `BUSINESS_HOURS_MORNING_END` === 750
- `BUSINESS_HOURS_AFTERNOON_START` === 870
- `BUSINESS_HOURS_AFTERNOON_END` === 1080
- `BILLING_INCREMENT_MINUTES` === 15
- `IVA_RATE` === 0.23

### MI-11: calculateRemoteAssistancePricing — business hours only (morning)
- Input: startTime="09:00", endTime="11:00", isWeekendOrHoliday=false
- Expected: totalValue based on 120min at €45/h, businessMinutes=120, offHoursMinutes=0

### MI-12: calculateRemoteAssistancePricing — off-hours only
- Input: startTime="19:00", endTime="20:00", isWeekendOrHoliday=false
- Expected: totalValue based on 60min at €60/h, businessMinutes=0, offHoursMinutes=60

### MI-13: calculateRemoteAssistancePricing — lunch gap crossing (12:00-13:00)
- Input: startTime="12:00", endTime="13:00", isWeekendOrHoliday=false
- Expected: split at 12:30 — business [12:00-12:30]=30min, off-hours [12:30-13:00]=30min

### MI-14: calculateRemoteAssistancePricing — afternoon boundary (14:00-15:00)
- Input: startTime="14:00", endTime="15:00", isWeekendOrHoliday=false
- Expected: split at 14:30 — off-hours [14:00-14:30]=30min, business [14:30-15:00]=30min

### MI-15: calculateRemoteAssistancePricing — full-day crossing all boundaries
- Input: startTime="08:00", endTime="19:00", isWeekendOrHoliday=false
- Expected: segments across all 4 boundaries, mixed business/off-hours

### MI-16: calculateRemoteAssistancePricing — weekend → all off-hours
- Input: startTime="10:00", endTime="12:00", isWeekendOrHoliday=true
- Expected: totalValue at €60/h for entire duration, businessMinutes=0

### MI-17: calculateRemoteAssistancePricing — 15-min rounding
- Input: startTime="09:00", endTime="09:07", isWeekendOrHoliday=false
- Expected: billingMinutes=15 (rounded up from 7)

### MI-18: calculateRemoteAssistancePricing — Contrato → zero cost
- Input: startTime="09:00", endTime="10:00", paymentMethod="Contrato"
- Expected: isZeroCost=true, totalValue=0

### MI-19: calculateRemoteAssistancePricing — Garantia → zero cost
- Input: startTime="09:00", endTime="10:00", paymentMethod="Garantia"
- Expected: isZeroCost=true, totalValue=0

### MI-20: calculateRemoteAssistancePricing — missing times
- Input: startTime="", endTime=""
- Expected: all zeroed result

### MI-21: Work Sheet Views — pricing section visible without displacement
- Render CreateView with hasDisplacement=false, arrivalTime="09:00", departureTime="10:00"
- Expected: hourly rate and labor cost rows visible, travel fee and mileage NOT visible

### MI-22: Work Sheet Views — displacement costs conditional
- Render CreateView with hasDisplacement=true, totalKms=100
- Expected: travel fee and mileage rows visible

### MI-23: Work Sheet Views — rates from constants
- Render CreateView with weekendHoliday=false
- Expected: hourly rate displays "55€"

### MI-24: Remote Assistance Views — pricing note text
- Render CreateView
- Expected: note contains "€45/hora (09:00-12:30, 14:30-18:00) | €60/hora (outras horas) + IVA"

### MI-25: Remote Assistance Views — breakdown labels
- Render DetailView with billable session
- Expected: labels show "Horário Comercial (09:00-12:30, 14:30-18:00)" and "Fora do Horário Comercial (inclui 12:30-14:30)"

### MI-26: Remote Assistance Views — zero-cost notice on Contrato
- Render CreateView with paymentMethod="Contrato"
- Expected: zero-cost notice visible, pricing breakdown hidden

### MI-27: Backend WS extractIndexFields — correct pricing fields
- Call extractIndexFields with weekday data, arrivalTime="09:00", departureTime="11:00", totalKms=100, hasDisplacement=true
- Expected: hourlyRate=55, laborPrice=110, travelFee=45, kmsPrice=45, totalPrice=200

### MI-28: Backend RA extractIndexFields — correct value fields
- Call extractIndexFields with business hours session 09:00-10:00, paymentMethod="Faturação"
- Expected: businessHoursValue=45, afterHoursValue=0, valorAssist=45

## [MA] — Acceptance Test Plan

### MA-01: End-to-end Work Sheet pricing with new rates
- Create a Work Sheet for weekday, non-subscribed client with displacement 100km, arrival 09:00 departure 11:00
- Verify: hourlyRate=55, laborPrice=110, travelFee=45, mileagePrice=45, totalPrice=200
- Covers: PRICE-AC-001, AC-003, AC-005, AC-012

### MA-02: End-to-end Work Sheet pricing — weekend
- Create a Work Sheet for weekend, hasDisplacement=true, totalKms=200, arrival 10:00 departure 13:00
- Verify: hourlyRate=70, laborPrice=210, travelFee=60, mileagePrice=90, totalPrice=360
- Covers: PRICE-AC-002, AC-004

### MA-03: End-to-end Remote Assistance — split billing across lunch
- Create a Remote Assistance for weekday 12:00-13:00, paymentMethod="Faturação"
- Verify: split at 12:30, business portion billed at €45/h, off-hours at €60/h
- Covers: PRICE-AC-006, AC-007, AC-008

### MA-04: End-to-end Remote Assistance — Contrato zero cost
- Create a Remote Assistance with paymentMethod="Contrato"
- Verify: zero-cost notice displayed, totalValue=0
- Covers: PRICE-AC-011

### MA-05: End-to-end Remote Assistance — pricing note display
- Open Remote Assistance Create view
- Verify: pricing note shows "€45/hora (09:00-12:30, 14:30-18:00) | €60/hora (outras horas) + IVA"
- Covers: PRICE-AC-010, PRICE-UX-001
