import { Router } from "express";
import { incrementClicks } from "../controllers/link.controller.js";

const router = Router();

router.route("/l/:linkId").get(incrementClicks);

export default router;
