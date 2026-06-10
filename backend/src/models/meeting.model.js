import mongoose, { Schema } from "mongoose";


const meetingSchema = new Schema(
    {
        user_id: { type: String },
        meetingCode: { type: String, required: true },
        date: { type: Date, default: Date.now, required: true },
        status: { type: String, default: "active", required: true },
        summary: { type: String },
        chatLogs: { type: Array, default: [] }
    }
)

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };