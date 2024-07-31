import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import router from "./user.route.js";
import { getStationPage } from "../controllers/station.controller.js";

const router = Router();

router.route("/s/:url").get(getStationPage);


export default router;