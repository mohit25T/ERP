import CompanyGSTConfig from "./CompanyGSTConfig.js";
import User from "../../core/users/User.js";
import StateCodeUtil from "../../../shared/utils/StateCodeUtil.js";

/**
 * Get Company GST Configuration
 */
export const getGstConfig = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        let config = await CompanyGSTConfig.findOne({ companyId });

        if (!config) {
            // Fallback: Fetch core data from User profile to pre-fill the form
            const user = await User.findById(req.user.id);
            if (!user) return res.status(200).json({ exists: false });

            return res.status(200).json({
                exists: false,
                gstin: user.gstin || "",
                legalName: user.companyName || user.name || "",
                address: user.address || "",
                pan: user.pan || "",
                pincode: user.pincode || "",
                stateCode: StateCodeUtil.getCode(user.state),
                isEInvoiceEnabled: true,
                isEWayBillEnabled: true
            });
        }

        // Mask passwords/secrets before sending to UI
        const responseData = config.toObject();
        if (responseData.eInvoicePassword) responseData.eInvoicePassword = "********";
        if (responseData.eWayBillPassword) responseData.eWayBillPassword = "********";
        responseData.exists = true;

        res.status(200).json(responseData);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch GST config", error: err.message });
    }
};

/**
 * Update or Create Company GST Configuration
 */
export const updateGstConfig = async (req, res) => {
    try {
        const companyId = req.user.companyId || req.user.id;
        const updateData = req.body;

        // Ensure sensitive fields are only updated if provided and not masked
        const cleanData = { ...updateData, companyId };
        
        if (cleanData.eInvoicePassword === "********") delete cleanData.eInvoicePassword;
        if (cleanData.eWayBillPassword === "********") delete cleanData.eWayBillPassword;

        let config = await CompanyGSTConfig.findOneAndUpdate(
            { companyId },
            cleanData,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            message: "Compliance configuration synchronized successfully",
            config: {
                ...config.toObject(),
                eInvoicePassword: config.eInvoicePassword ? "********" : "",
                eWayBillPassword: config.eWayBillPassword ? "********" : ""
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update GST config", error: err.message });
    }
};
