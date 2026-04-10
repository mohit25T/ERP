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
  static async recordSalesInvoiceAccount(invoice, customerName) {
    return await this.createJournalEntry({
      description: `Sales Invoice #${invoice.invoiceNumber} - ${customerName}`,
      debitAccount: `Customer: ${customerName}`,
      creditAccount: "Sales Revenue",
      amount: invoice.totalAmount,
      referenceType: "invoice",
      referenceId: invoice._id
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
      creditAccount: `Customer: ${customerName}`,
      amount,
      referenceType,
      referenceId
    });
  }
}

export default AccountingService;
