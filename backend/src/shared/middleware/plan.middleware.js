const checkPlan = (allowedPlans) => {
  return (req, res, next) => {
    // Assuming req.user is set by auth middleware and has a .plan property
    // Example plans: 'ERP_BASIC', 'ERP_BILLING'
    const userPlan = req.user?.plan || 'ERP_BILLING'; // Default to BILLING for all authenticated users for now
    const userRole = req.user?.role?.toLowerCase();

    // Bypass plan check for Super Admin/Admin
    if (["super_admin", "admin"].includes(userRole)) {
      return next();
    }
    
    if (!allowedPlans.includes(userPlan)) {
      return res.status(403).json({
        error: `Access Denied: Your current plan (${userPlan}) does not support this feature. Required plan(s): ${allowedPlans.join(', ')}`
      });
    }
    
    next();
  };
};

export default checkPlan;
