import { Router } from "express";
import { addToHistory, getUserHistory, login, register, getMeetingStatus, terminateMeeting } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)
router.route("/meeting_status").get(getMeetingStatus)
router.route("/terminate_meeting").post(terminateMeeting)

export default router;