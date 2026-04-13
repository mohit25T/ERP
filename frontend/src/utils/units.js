export const CONVERSIONS = {
  dagina: 50,
  kg: 1,
  gram: 0.001,
  ton: 1000,
  mts: 1000,
  unit: 1,
  pcs: 1,
};

/**
 * Normalizes pieces count based on the unit.
 */
export const normalizeToPieces = (qty, unit) => {
  const factor = CONVERSIONS[unit?.toLowerCase()] || 1;
  return qty * factor;
};

/**
 * Converts pieces count into target unit.
 * e.g., 50 pieces -> 1 dagina
 */
export const convertFromPieces = (qty, unit) => {
  const factor = CONVERSIONS[unit?.toLowerCase()] || 1;
  return qty / factor;
};

const unitsUtil = {
  CONVERSIONS,
  normalizeToPieces,
  convertFromPieces,
};

export default unitsUtil;
