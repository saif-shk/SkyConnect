import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({ message: "SkyConnect Backend API is running!" });
});

const start = async () => {
    try {
        app.set("mongo_user")
        const MONGO_URI = process.env.MONGO_URI
        
        console.log('Connecting to MongoDB...');
        const connectionDb = await mongoose.connect(MONGO_URI)
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`)
        
        server.listen(app.get("port"), () => {
            console.log(`SkyConnect Backend running on PORT ${app.get("port")}`)
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        // Continue without MongoDB for now
        server.listen(app.get("port"), () => {
            console.log(`SkyConnect Backend running on PORT ${app.get("port")} (without MongoDB)`)
        });
    }
}



start();