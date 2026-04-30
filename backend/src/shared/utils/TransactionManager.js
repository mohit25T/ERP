import mongoose from "mongoose";

/**
 * TransactionManager: Advanced Atomic Command Wrapper
 * Designed to ensure absolute data consistency across cross-module ERP operations.
 */
class TransactionManager {
  /**
   * Execute a set of operations within a single MongoDB transaction.
   * @param {Function} task - An async function that receives the transaction session.
   */
  static async execute(task) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await task(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      console.error("[TRANSACTION ERROR]: Protocol Aborted. Error Details:", error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default TransactionManager;
