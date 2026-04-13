import express from "express";
import { getBoms, getBomByProduct, upsertBom, deleteBom } from "../controllers/bom.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getBoms);
router.get("/product/:productId", getBomByProduct);
router.post("/product/:productId", upsertBom);
router.delete("/:id", deleteBom);

export default router;
