import Payroll from "./Payroll.js";
import Staff from "../../core/users/Staff.js";
import Ledger from "../ledger/Ledger.js";

// Create/Generate Payroll Enrtry
export const createPayroll = async (req, res) => {
  try {
    const { staffId, month, year, workingDays, bonus, deductions } = req.body;
    
    // Check if payroll already exists for this staff/month/year
    const exists = await Payroll.findOne({ staff: staffId, month, year });
    if (exists) {
      return res.status(400).json({ msg: "Payroll for this month already exists for this employee" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ msg: "Staff not found" });

    // Calculate Salary
    let grossSalary = staff.baseSalary;
    if (staff.salaryType === "daily") {
       grossSalary = staff.baseSalary * workingDays;
    }

    const netSalary = grossSalary + Number(bonus || 0) - Number(deductions || 0);

    const payroll = await Payroll.create({
      staff: staffId,
      month,
      year,
      workingDays,
      bonus,
      deductions,
      grossSalary,
      netSalary,
      status: "unpaid"
    });

    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all Payroll entries
export const getPayrollEntries = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month) query.month = month;
    if (year) query.year = year;

    const entries = await Payroll.find(query).populate("staff").sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Disbursement: Pay Salary & Sync to Ledger
export const paySalary = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id).populate("staff");
    
    if (!payroll) return res.status(404).json({ msg: "Payroll record not found" });
    if (payroll.status === "paid") return res.status(400).json({ msg: "Salary already paid" });

    payroll.status = "paid";
    payroll.paymentDate = new Date();
    await payroll.save();

    // AUTO-CREATE LEDGER ENTRY
    const ledgerEntry = new Ledger({
      type: "expense",
      category: "Salary",
      amount: payroll.netSalary,
      description: `Worker Salary Paid: ${payroll.staff.name} (${payroll.month}-${payroll.year})`,
      date: new Date()
    });
    await ledgerEntry.save();

    res.json({ msg: "Salary disbursed and recorded in Financial Ledger", payroll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Payroll record (Only if unpaid)
export const deletePayroll = async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);
      if (!payroll) return res.status(404).json({ msg: "Payroll not found" });
      if (payroll.status === "paid") return res.status(400).json({ msg: "Cannot delete a paid salary record" });
      
      await Payroll.findByIdAndDelete(req.params.id);
      res.json({ msg: "Payroll record deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};
