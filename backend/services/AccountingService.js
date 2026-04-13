import JournalEntry from "../models/JournalEntry.js";
import Ledger from "../models/Ledger.js";

class AccountingService {
  /**
   * Automatically create double-entry journal logs
   */
  static async createJournalEntry({ description, debitAccount, creditAccount, amount, referenceType, referenceId }) {
    return await JournalEntry.create({
      description,
      debitAccount,
      creditAccount,
      amount,
      referenceType,
      referenceId
    });
  }

  /**
   * Helper for Sales Invoice automated accounting
   * Dr Customer / Cr Sales
   */
  static async recordSalesInvoiceAccount(invoice, customer) {
    // 1. Journal Entry
    await this.createJournalEntry({
      description: `Sales Invoice #${invoice.invoiceNumber} - ${customer.name}`,
      debitAccount: `Trade Receivables: ${customer.name}`,
      creditAccount: "Sales Revenue",
      amount: invoice.totalAmount,
      referenceType: "invoice",
      referenceId: invoice._id
    });

    // 2. Ledger Entry (Optional - if we want a separate ledger record for the customer)
    // In this system, Ledger seems to be used for Income/Expense tracking.
    // We'll keep it consistent with existing usage.
  }

  /**
   * Helper for Purchase integrated accounting
   * Dr Material Inventory / Cr Supplier Payable
   */
  static async recordPurchase(purchase, supplier, materialName) {
    return await this.createJournalEntry({
      description: `Purchase #${purchase._id.toString().slice(-6).toUpperCase()} - ${materialName} from ${supplier.name}`,
      debitAccount: "Raw Material Inventory",
      creditAccount: `Trade Payables: ${supplier.name}`,
      amount: purchase.totalAmount,
      referenceType: "purchase",
      referenceId: purchase._id
    });
  }

  /**
   * Helper for Production Cost Allocation
   * Dr Finished Goods Asset / Cr Raw Material Asset
   */
  static async recordProduction(production, productName) {
    return await this.createJournalEntry({
      description: `Production Batch ${production.batchNumber} - ${productName}`,
      debitAccount: "Finished Goods Inventory",
      creditAccount: "Raw Material Inventory",
      amount: production.totalCost,
      referenceType: "production",
      referenceId: production._id
    });
  }

  /**
   * Helper for Payment received
   * Dr Cash/Bank / Cr Customer
   */
  static async recordPaymentReceived({ amount, customerName, referenceId, referenceType }) {
    return await this.createJournalEntry({
      description: `Payment Received - ${customerName}`,
      debitAccount: "Cash/Bank Account",
      creditAccount: `Trade Receivables: ${customerName}`,
      amount,
      referenceType,
      referenceId
    });
  }

  /**
   * Helper for Payment Made (To Supplier)
   * Dr Supplier Payable / Cr Cash/Bank
   */
  static async recordPaymentMade({ amount, supplierName, referenceId, referenceType }) {
    return await this.createJournalEntry({
      description: `Payment Made - ${supplierName}`,
      debitAccount: `Trade Payables: ${supplierName}`,
      creditAccount: "Cash/Bank Account",
      amount,
      referenceType,
      referenceId
    });
  }

  /**
   * Reverse/Delete accounting logs when a record is deleted
   */
  static async deleteReferenceEntries(referenceId) {
    return await JournalEntry.deleteMany({ referenceId });
  }
}

export default AccountingService;

