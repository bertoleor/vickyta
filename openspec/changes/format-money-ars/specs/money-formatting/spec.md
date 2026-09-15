# Money Formatting Specification

## Purpose

Formato único y determinista de montos en pesos argentinos para la UI de VICKY, sin dependencias ni estado.

## Requirements

### Requirement: ARS Formatting

The system MUST format finite numbers as ARS using `es-AR` with exactly 2 fraction digits.

#### Scenario: Positive amount

- GIVEN value `1234.5`
- WHEN `formatMoneyARS` is called
- THEN it returns the `es-AR` ARS string for `1234.5` with 2 decimals

#### Scenario: Zero

- GIVEN value `0`
- WHEN `formatMoneyARS` is called
- THEN it returns the `es-AR` ARS string for zero with 2 decimals

#### Scenario: Negative amount

- GIVEN value `-50`
- WHEN `formatMoneyARS` is called
- THEN it returns the `es-AR` ARS string preserving the sign

### Requirement: Rounding

The system MUST round to 2 decimals (half away from zero at the third decimal).

#### Scenario: Rounds up

- GIVEN value `10.005`
- WHEN `formatMoneyARS` is called
- THEN the cent part equals `01` (i.e. same as formatting `10.01`)

#### Scenario: Rounds down

- GIVEN value `10.004`
- WHEN `formatMoneyARS` is called
- THEN the cent part equals `00` (i.e. same as formatting `10`)

### Requirement: Invalid Input Rejection

The system MUST throw `RangeError` for non-finite inputs (`NaN`, `Infinity`, `-Infinity`).

#### Scenario: NaN rejected

- GIVEN value `NaN`
- WHEN `formatMoneyARS` is called
- THEN it throws `RangeError`

#### Scenario: Infinity rejected

- GIVEN value `Infinity`
- WHEN `formatMoneyARS` is called
- THEN it throws `RangeError`
