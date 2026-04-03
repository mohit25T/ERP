/**
 * GSTIN Validation Utility for Indian ERP
 * Implements Regex and Mod 36 Checksum logic.
 */

const charMap = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const validateGSTIN = (gstin) => {
  if (!gstin) return { isValid: false, message: "GSTIN is required" };
  
  const cleanGSTIN = gstin.trim().toUpperCase();
  
  // 1. Regex Check
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(cleanGSTIN)) {
    return { isValid: false, message: "Invalid GSTIN Format (Expected: 00AAAAA0000A1Z1)" };
  }

  // 2. Mod 36 Checksum Check
  try {
    const inputChars = cleanGSTIN.split("");
    let totalSum = 0;

    for (let i = 0; i < 14; i++) {
        let charVal = charMap.indexOf(inputChars[i]);
        let multiplier = (i % 2 === 0) ? 1 : 2;
        let product = charVal * multiplier;
        
        // Sum digits in base 36
        product = Math.floor(product / 36) + (product % 36);
        totalSum += product;
    }

    const checkDigitVal = (36 - (totalSum % 36)) % 36;
    const expectedCheckDigit = charMap[checkDigitVal];
    const actualCheckDigit = inputChars[14];

    if (expectedCheckDigit !== actualCheckDigit) {
        return { 
          isValid: false, 
          message: `Mathematical Checksum Mismatch (Expected ${expectedCheckDigit}, got ${actualCheckDigit}). Please check for typos.`,
          isChecksumError: true 
        };
    }

    return { isValid: true, message: "Structurally Valid GSTIN" };
  } catch (err) {
    return { isValid: false, message: "Verification failed. Check input." };
  }
};
