import mongoose from "mongoose";
import Product from "./models/Product.js";
import BOM from "./models/BOM.js";
import dotenv from "dotenv";

dotenv.config();

async function migrateBOM() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration...");

    const productsWithBom = await Product.find({ 
      bom: { $exists: true, $not: { $size: 0 } } 
    });

    console.log(`Found ${productsWithBom.length} products with embedded BOMs.`);

    for (const product of productsWithBom) {
      // Check if BOM already exists for this product
      const existingBOM = await BOM.findOne({ product: product._id });
      
      if (!existingBOM) {
        await BOM.create({
          product: product._id,
          items: product.bom.map(item => ({
            material: item.material,
            quantity: item.quantity,
            unit: item.unit || "kg"
          })),
          notes: "Auto-migrated from Product embedded BOM"
        });
        console.log(`✅ Migrated BOM for: ${product.name}`);
      } else {
        console.log(`⏭️ BOM already exists for: ${product.name}, skipping.`);
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

migrateBOM();
