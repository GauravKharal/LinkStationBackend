import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserDetails,
  changePassword,
  updateUserAvatar,
  updateUserDetails,
  getRegisterOTP,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register-otp").post(upload.none(), getRegisterOTP);

router.route("/register").post(upload.none(), registerUser);

router.route("/login").post(upload.none(), loginUser);

//Secure Routes (Require Users to be Logged In)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/get-user").get(verifyJWT, getUserDetails);
router.route("/change-password").post(verifyJWT, upload.none(), changePassword);
router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-user-details")
  .post(verifyJWT, upload.none(), updateUserDetails);

export default router;
