import mongoose from "mongoose";
import EncryptionUtil from "../../../shared/utils/EncryptionUtil.js";

const companyGSTConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    gstin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format"]
    },
    legalName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true
    },
    stateCode: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 2
    },
    pan: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"]
    },
    pincode: {
      type: String,
      required: true,
      match: [/^[0-9]{6}$/, "Invalid Pincode format"]
    },
    // Credentials (Encrypted)
    eInvoiceUsername: { type: String, default: "" },
    eInvoicePassword: { type: String, default: "" },
    eWayBillUsername: { type: String, default: "" },
    eWayBillPassword: { type: String, default: "" },
    // Flags
    isEInvoiceEnabled: { type: Boolean, default: false },
    isEWayBillEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Encryption Hook for Credentials
companyGSTConfigSchema.pre("save", function (next) {
  const fields = ["eInvoicePassword", "eWayBillPassword"];
  
  fields.forEach((field) => {
    if (this.isModified(field) && this[field]) {
      try {
        // Only encrypt if it's not already encrypted (check for EncryptionUtil format)
        // EncryptionUtil.encrypt returns base64 which usually contains SALT+IV+TAG
        // For simplicity here, we always encrypt what's passed in from the controller.
        // We assume the controller passes plain text.
        this[field] = EncryptionUtil.encrypt(this[field]);
      } catch (err) {
        return next(err);
      }
    }
  });
  next();
});

// Decryption Helper
companyGSTConfigSchema.methods.getCredentials = function () {
  return {
    einvoice: {
      username: this.eInvoiceUsername,
      password: this.eInvoicePassword ? EncryptionUtil.decrypt(this.eInvoicePassword) : ""
    },
    ewaybill: {
      username: this.eWayBillUsername,
      password: this.eWayBillPassword ? EncryptionUtil.decrypt(this.eWayBillPassword) : ""
    }
  };
};

const CompanyGSTConfig = mongoose.model("CompanyGSTConfig", companyGSTConfigSchema);

export default CompanyGSTConfig;
