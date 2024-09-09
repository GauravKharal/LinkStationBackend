import { Router } from "express";
import { incrementClicks } from "../controllers/link.controller.js";

const router = Router();

router.route("/l/click/:linkId").get(incrementClicks);

export default router;
