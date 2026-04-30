/**
 * Financial Lock Middleware
 * Enforces a second layer of security for sensitive fiscal mutations.
 * Requires a pre-shared key (PSK) to be provided in the headers.
 */
export const financialLock = (req, res, next) => {
  const financialKey = req.header("x-financial-key");
  const MASTER_KEY = process.env.FINANCIAL_KEY || "erp123";

  // Only enforce on mutations (POST, PUT, DELETE) or sensitive GET reports
  if (req.method !== "GET" || req.path.includes("summary") || req.path.includes("pnl")) {
    if (!financialKey || financialKey !== MASTER_KEY) {
      return res.status(403).json({ 
        msg: "Financial Integrity Protocol Violation: Master Key Missing or Invalid.",
        code: "FINANCIAL_LOCK_BLOCKED"
      });
    }
  }

  next();
};
