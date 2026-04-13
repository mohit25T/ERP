import AuditLog from "../models/AuditLog.js";

class AuditService {
  static async logAction({ user, action, resource, resourceId, changes, req }) {
    try {
      await AuditLog.create({
        user: user._id || user.id || user,
        action,
        resource,
        resourceId,
        changes,
        ipAddress: req?.ip || "unknown"
      });
    } catch (err) {
      console.error("[AUDIT LOG ERROR]", err.message);
    }
  }
}

export default AuditService;
