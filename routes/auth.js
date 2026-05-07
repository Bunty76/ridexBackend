import express from "express";
const router = express.Router();
import {
  registerDriver,
  loginDriver,
  updateDriverStatus,
  loginAdmin,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  sendOtp,
  verifyOtpUser,
} from "../controllers/authController.js";
import { protect, protectUser } from "../middleware/auth.js";

router.post("/auth/register", registerDriver);
router.post("/auth/login", loginDriver);
router.post("/admin/login", loginAdmin);
router.patch("/driver/status", protect, updateDriverStatus);

router.post("/user/register", registerUser);
router.post("/user/login", loginUser);
router.post("/user/send-otp", sendOtp);
router.post("/user/verify-otp", verifyOtpUser);
router.route("/user/profile").get(protectUser, getUserProfile).put(protectUser, updateUserProfile);

export default router;
