import Purchase from "../../modules/erp/purchasing/Purchase.js";
import InventoryService from "../../modules/erp/inventory/InventoryService.js";
import AccountingService from "../../modules/billing/ledger/AccountingService.js";
import UnitService from "../../modules/erp/products/UnitService.js";

export default {
  /**
   * Fully processes a material inbound event when a purchase is "Mark as Received":
   *  1. Marks purchase as received with timestamp
   *  2. Normalizes quantity and increases product stock
   *  3. Creates double-entry accounting journal (Dr Inventory / Cr Payable)
   */
  processMaterialInbound: async ({ purchaseId, user }) => {
    const purchase = await Purchase.findById(purchaseId).populate("material").populate("supplier");
    if (!purchase) throw new Error("Purchase not found");

    // 1. Update purchase status
    purchase.status = "received";
    purchase.receivedAt = new Date();
    await purchase.save();

    // 2. Normalize quantity to base unit and increase stock
    const units = await UnitService.getUnits();
    const factor = units.find(u => u.name === (purchase.unit || "kg").toLowerCase())?.conversionFactor || 1;
    const normalizedQty = Number(purchase.quantity) * factor;

    await InventoryService.updateStock({
      productId: purchase.material._id,
      quantity: normalizedQty,
      type: "IN",
      referenceType: "purchase",
      referenceId: purchase._id,
      reason: `Stock inward: Purchase PO-${purchase._id.toString().slice(-6).toUpperCase()} received`
    });

    // 3. Create accounting journal entry
    const supplierName = purchase.supplier?.company || purchase.supplier?.name || "Supplier";
    const materialName = purchase.material?.name || "Material";

    await AccountingService.recordPurchase(purchase, purchase.supplier, materialName);

    console.log(`[ERP ORCHESTRATOR] Inbound complete: ${materialName} +${normalizedQty} units | Supplier: ${supplierName}`);

    return { purchase };
  },

  finalizeSalesInvoice: async () => ({})
};
