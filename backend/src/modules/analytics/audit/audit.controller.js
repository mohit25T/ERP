import AuditLog from "./AuditLog.js";

/**
 * Audit Logs Controller
 * Provides operational transparency and compliance data.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { resource, action, limit = 100 } = req.query;
    
    let query = {};
    if (resource) query.resource = resource;
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .populate("user", "name role")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Audit Vault synchronization failure." });
  }
};
