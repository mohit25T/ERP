import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token provided, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};

/**
 * Higher-order middleware to enforce RBAC
 * @param {Array<string>} roles - List of allowed roles
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized: Protocol breach detected." });
    }

    // Role mapping for Miracle-level naming conventions
    const userRole = req.user.role?.toLowerCase();
    
    // Admin always has master access
    if (["admin", "super_admin"].includes(userRole)) {
      return next();
    }

    if (roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      msg: `Forbidden: Access restricted for ${userRole.toUpperCase()}. Administrative elevation required.`
    });
  };
};

// Ready-to-use legacy wrappers
export const adminMiddleware = checkRole(["admin", "super_admin"]);
export const accountantMiddleware = checkRole(["accountant", "manager"]);
export const staffMiddleware = checkRole(["staff", "worker"]);
