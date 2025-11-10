import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
// import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000)
app.use(cors({
    origin: ["https://skyconnect-frontend.onrender.com", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// app.use("/api/v1/users", userRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({ message: "SkyConnect Backend API is running!" });
});

const start = async () => {
    try {
        // MongoDB connection
        const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nagaralprakash0_db_user:GTXGKsu4Xo8k0CtP@cluster0.qywwwxu.mongodb.net/skyconnect?retryWrites=true&w=majority"
        await mongoose.connect(MONGO_URI)
        console.log(`✅ MongoDB Connected Successfully!`)
    } catch (error) {
        console.log('⚠️ MongoDB connection failed, continuing without database:', error.message);
    }
    
    server.listen(app.get("port"), () => {
        console.log(`🚀 SkyConnect Backend running on PORT ${app.get("port")}`)
    });
}

start();