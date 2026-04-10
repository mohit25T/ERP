class GstService {
  /**
   * Calculate GST components based on states
   * @param {number} taxableAmount 
   * @param {number} gstRate 
   * @param {string} sellerState 
   * @param {string} buyerState 
   */
  static calculateGst(taxableAmount, gstRate, sellerState, buyerState) {
    const gstAmount = (taxableAmount * gstRate) / 100;
    const isSameState = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();

    let cgst = 0, sgst = 0, igst = 0;

    if (isSameState) {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    } else {
      igst = gstAmount;
    }

    return {
      taxableAmount,
      gstAmount,
      cgst,
      sgst,
      igst,
      totalAmount: taxableAmount + gstAmount
    };
  }

  static getRounding(amount) {
    return Math.round(amount * 100) / 100;
  }
}

export default GstService;
