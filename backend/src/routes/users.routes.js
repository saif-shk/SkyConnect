import { Router } from "express";
import { addToHistory, getUserHistory, login, register, getMeetingStatus, terminateMeeting, getUserProfile, sendEmailOtp } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)
router.route("/meeting_status").get(getMeetingStatus)
router.route("/terminate_meeting").post(terminateMeeting)
router.route("/get_user_profile").get(getUserProfile)
router.route("/send_email_otp").post(sendEmailOtp)

export default router;