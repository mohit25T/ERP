import UnitService from "../../modules/erp/products/UnitService.js";

/**
 * Legacy Units Utility Wrapper
 * Now redirects to the centralized UnitService to ensure database-driven consistency.
 * @deprecated Use UnitService directly instead.
 */
export const normalizeToPieces = async (qty, unit) => {
  return await UnitService.normalize(qty, unit);
};

export const convertFromPieces = async (qty, unit) => {
  return await UnitService.convertFromBase(qty, unit);
};

export default {
  normalizeToPieces,
  convertFromPieces,
};
