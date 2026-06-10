import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import mongoose from "mongoose";
import https from "https";
import { getRoomMessages, clearRoomData } from "./socketManager.js";

// In-memory data store for fallback mode when database is down
let inMemoryUsers = [];
let inMemoryMeetings = [];

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide username and password" });
    }

    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
            }

            let isPasswordCorrect = await bcrypt.compare(password, user.password);

            if (isPasswordCorrect) {
                let token = crypto.randomBytes(20).toString("hex");
                user.token = token;
                await user.save();
                return res.status(httpStatus.OK).json({ token: token });
            } else {
                return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
            }
        } else {
            // In-memory fallback
            const user = inMemoryUsers.find(u => u.username === username);
            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found (In-Memory Fallback)" });
            }

            let isPasswordCorrect = await bcrypt.compare(password, user.password);

            if (isPasswordCorrect) {
                let token = crypto.randomBytes(20).toString("hex");
                user.token = token;
                return res.status(httpStatus.OK).json({ token: token });
            } else {
                return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
            }
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    try {
        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(httpStatus.FOUND).json({ message: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                name: name,
                username: username,
                password: hashedPassword
            });

            await newUser.save();
            return res.status(httpStatus.CREATED).json({ message: "User Registered" });
        } else {
            // In-memory fallback
            const existingUser = inMemoryUsers.find(u => u.username === username);
            if (existingUser) {
                return res.status(httpStatus.FOUND).json({ message: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            inMemoryUsers.push({
                name,
                username,
                password: hashedPassword,
                token: ""
            });
            return res.status(httpStatus.CREATED).json({ message: "User Registered (In-Memory Fallback)" });
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ token: token });
            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "Invalid token or user not found" });
            }
            const meetings = await Meeting.find({ user_id: user.username });
            return res.json(meetings);
        } else {
            // In-memory fallback
            const user = inMemoryUsers.find(u => u.token === token);
            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "Invalid token or user not found" });
            }
            const meetings = inMemoryMeetings.filter(m => m.user_id === user.username);
            return res.json(meetings);
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(400).json({ message: "Token and meeting code are required" });
    }

    try {
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ token: token });
            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "Invalid token or user not found" });
            }

            const newMeeting = new Meeting({
                user_id: user.username,
                meetingCode: meeting_code
            });

            await newMeeting.save();
            return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
        } else {
            // In-memory fallback
            const user = inMemoryUsers.find(u => u.token === token);
            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ message: "Invalid token or user not found" });
            }

            inMemoryMeetings.push({
                user_id: user.username,
                meetingCode: meeting_code,
                date: new Date()
            });
            return res.status(httpStatus.CREATED).json({ message: "Added code to history (In-Memory Fallback)" });
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

const generateLocalSummaryFallback = (chatMessages) => {
    if (!chatMessages || chatMessages.length === 0) {
        return "No conversation logs were recorded during this meeting. The session ended with no active discussions.";
    }
    
    const transcriptSummary = chatMessages.map(m => `• **${m.sender}** said: "${m.data}"`).join("\n");
    return `### Meeting Summary (Local Archive Mode)
The participants held a brief collaboration session. The logged conversation details are summarized below:

${transcriptSummary}

**Outcomes & Actions:**
- Meeting terminated successfully.
- Chat logs archived in the system database.`;
}

const generateAISummary = (chatMessages) => {
    return new Promise((resolve) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log("⚠️ No GEMINI_API_KEY found. Generating local summary template.");
            return resolve(generateLocalSummaryFallback(chatMessages));
        }
        
        const transcript = chatMessages.map(m => `${m.sender}: ${m.data}`).join("\n");
        const prompt = `You are a virtual meeting assistant. Below is the chat log of a video meeting. Please read it and generate a meeting summary containing:
1. A brief paragraph summarizing the general conversation.
2. A bulleted list of key decisions, outcomes, or action items assigned to participants.

Keep it highly professional.

Chat Log:
${transcript}`;

        const postData = JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        resolve(text);
                    } else {
                        console.warn("⚠️ Gemini response structure mismatch. Falling back.");
                        resolve(generateLocalSummaryFallback(chatMessages));
                    }
                } catch (e) {
                    console.error("❌ Failed to parse Gemini response:", e);
                    resolve(generateLocalSummaryFallback(chatMessages));
                }
            });
        });

        req.on('error', (e) => {
            console.error("❌ Gemini API request error:", e);
            resolve(generateLocalSummaryFallback(chatMessages));
        });

        req.write(postData);
        req.end();
    });
}

const getMeetingStatus = async (req, res) => {
    const { meetingCode } = req.query;

    if (!meetingCode) {
        return res.status(400).json({ message: "Meeting code is required" });
    }

    try {
        if (mongoose.connection.readyState === 1) {
            const meeting = await Meeting.findOne({ meetingCode }).sort({ date: -1 });
            if (meeting) {
                return res.json({ 
                    status: meeting.status || 'active', 
                    summary: meeting.summary || null,
                    date: meeting.date 
                });
            }
            return res.json({ status: 'active', summary: null });
        } else {
            // In-memory fallback
            const meeting = inMemoryMeetings
                .filter(m => m.meetingCode === meetingCode)
                .sort((a, b) => b.date - a.date)[0];
            
            if (meeting) {
                return res.json({ 
                    status: meeting.status || 'active', 
                    summary: meeting.summary || null,
                    date: meeting.date 
                });
            }
            return res.json({ status: 'active', summary: null });
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

const terminateMeeting = async (req, res) => {
    const { token, meetingCode } = req.body;

    if (!meetingCode) {
        return res.status(400).json({ message: "Meeting code is required" });
    }

    try {
        const chatMessages = getRoomMessages(meetingCode);
        const summary = await generateAISummary(chatMessages);
        clearRoomData(meetingCode);

        if (mongoose.connection.readyState === 1) {
            let meeting = await Meeting.findOne({ meetingCode }).sort({ date: -1 });
            
            if (!meeting) {
                let username = "Guest";
                if (token) {
                    const user = await User.findOne({ token });
                    if (user) username = user.username;
                }
                
                meeting = new Meeting({
                    user_id: username,
                    meetingCode: meetingCode
                });
            }
            
            meeting.status = "terminated";
            meeting.summary = summary;
            meeting.chatLogs = chatMessages;
            
            await meeting.save();
            return res.status(httpStatus.OK).json({ message: "Meeting terminated and summarized", summary });
        } else {
            let meeting = inMemoryMeetings.find(m => m.meetingCode === meetingCode);
            
            if (!meeting) {
                let username = "Guest";
                if (token) {
                    const user = inMemoryUsers.find(u => u.token === token);
                    if (user) username = user.username;
                }
                
                meeting = {
                    user_id: username,
                    meetingCode: meetingCode,
                    date: new Date()
                };
                inMemoryMeetings.push(meeting);
            }
            
            meeting.status = "terminated";
            meeting.summary = summary;
            meeting.chatLogs = chatMessages;
            
            return res.status(httpStatus.OK).json({ message: "Meeting terminated and summarized (In-Memory Fallback)", summary });
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

export { login, register, getUserHistory, addToHistory, getMeetingStatus, terminateMeeting };