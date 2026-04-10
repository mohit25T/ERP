import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // "create", "update", "delete", "finalize"
    },
    resource: {
      type: String,
      required: true, // "invoice", "order", "payment"
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
