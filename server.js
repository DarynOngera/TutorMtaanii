import express from "express";
import dotenv from "dotenv";
import pkg from "twilio";
const { twiml } = pkg;
const MessagingResponse = twiml.MessagingResponse;
import twilio from "twilio";
const twilioClient = pkg(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
import { getGroqChatCompletion } from "./groq3.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Utility to build structured prompt
function createStructuredPrompt({ skillLevel, learningGoal, learningMethod, topics }) {
  return `You are a personalized AI tutor called TutorMtaani for a ${skillLevel} learner.
The user wants to learn about ${learningGoal}, especially these topics: ${topics.join(", ")}.
They prefer learning through ${learningMethod}.

Please suggest a curated list of up to 5 learning resources. For each, include:
- Title
- Resource Type (Video, Course, Article, etc.)
- Platform (e.g., YouTube, Coursera)
- A 1-line description
- A direct link (if possible)

Respond in clear bullet points.`;
}




// In-memory conversation history per user
const userConversations = {};

// WhatsApp-friendly menu options
const MAIN_MENU = `Welcome! Please choose an option:\n\n1. Start or continue learning path\n2. Get a daily learning tip\n3. Take a quiz\n4. View progress\n5. Search for a resource\n6. Switch language\n7. Send feedback\n\nReply with the number or the option name.\nYou can type 'menu' at any time to return here.`;

// Extract structured learning info from free-form text
function extractUserDataFromFreeForm(input) {
  let skillLevel = '';
  let learningGoal = '';
  let learningMethod = '';
  let topics = [];

  if (/beginner|novice/i.test(input)) skillLevel = 'beginner';
  else if (/intermediate/i.test(input)) skillLevel = 'intermediate';
  else if (/advanced|expert/i.test(input)) skillLevel = 'advanced';

  if (/video|youtube/i.test(input)) learningMethod = 'videos';
  else if (/article|blog/i.test(input)) learningMethod = 'articles';
  else if (/interactive|hands[- ]?on/i.test(input)) learningMethod = 'interactive';

  const goalMatch = input.match(/want to learn about ([^.,;]+)/i);
  if (goalMatch) {
    learningGoal = goalMatch[1].trim();
    topics = learningGoal.split(/ in | for | on | with | and |,|\./i).map(s => s.trim()).filter(Boolean);
  } else {
    const learnMatch = input.match(/learn(?:ing)?(?: about)? ([^.,;]+)/i);
    if (learnMatch) {
      learningGoal = learnMatch[1].trim();
      topics = learningGoal.split(/ in | for | on | with | and |,|\./i).map(s => s.trim()).filter(Boolean);
    }
  }
  return { skillLevel, learningGoal, learningMethod, topics };
}

function getMenuOption(text) {
  const normalized = text.trim().toLowerCase();
  if (["1", "learning path", "start", "continue"].includes(normalized)) return 1;
  if (["2", "tip", "daily tip"].includes(normalized)) return 2;
  if (["3", "quiz", "take quiz", "quiz me"].includes(normalized)) return 3;
  if (["4", "progress", "view progress"].includes(normalized)) return 4;
  if (["5", "search", "resource", "find resource"].includes(normalized)) return 5;
  if (["6", "language", "switch language"].includes(normalized)) return 6;
  if (["7", "feedback", "send feedback"].includes(normalized)) return 7;
  if (["menu", "main menu", "help"].includes(normalized)) return 0;
  return null;
}

// WhatsApp webhook route
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;

  console.log(`--- Incoming Webhook Request ---`);
  console.log(`From: ${from}`);
  console.log(`Message: ${incomingMsg}`);

  // Retrieve or initialize conversation history
  if (!userConversations[from]) {
    userConversations[from] = [];
  }

  const twiml = new MessagingResponse();

  // Add the user's new message to the conversation history
  userConversations[from].push({ role: "user", content: incomingMsg });
  console.log(`Conversation history before Groq call:`, JSON.stringify(userConversations[from], null, 2));

  try {
    // Pass the full conversation history to the AI tutor
    const groqResponse = await getGroqChatCompletion(userConversations[from]);
    const reply = groqResponse.choices[0]?.message?.content || "Sorry, I didn’t understand that.";
    userConversations[from].push({ role: "assistant", content: reply });
    
    // Log interaction
    const logLine = `[${new Date().toISOString()}] FROM: ${from}
USER: ${incomingMsg}
BOT: ${reply}
---
`;
    fs.appendFile("user_interactions.log", logLine, err => {
      if (err) console.error("Failed to log user interaction:", err);
    });
    // Also log to terminal
    console.log("Groq reply:", reply);

    twiml.message(reply);
    console.log(`--- Sending TwiML to Twilio ---`);
    console.log(twiml.toString());
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Full error in /webhook:", err);
    twiml.message("Oops, something went wrong. Please try again later.");
    res.type("text/xml").send(twiml.toString());
  }
});

app.get("/status", (req, res) => {
  res.send("Server is running.");
});

// UI test page (GET)
app.get("/", (req, res) => {
  res.render("index", { reply: null, userPrompt: null });
});

// UI POST route with CLI-like structure
app.post("/", async (req, res) => {
  const { skillLevel, learningGoal, learningMethod, topics } = req.body;
  const topicsArray = topics.split(",").map(t => t.trim());

  // Use the same system prompt as WhatsApp for consistency
  const userMessages = [
    { role: "user", content: `Skill Level: ${skillLevel}\nLearning Goal: ${learningGoal}\nPreferred Method: ${learningMethod}\nTopics: ${topicsArray.join(", ")}` }
  ];

  try {
    const groqResponse = await getGroqChatCompletion(userMessages);
    const reply = groqResponse.choices[0]?.message?.content || "Sorry, I didn’t understand that.";
    res.render("index", { reply, userPrompt: userMessages[0].content });
  } catch (err) {
    console.error("Web error:", err.message);
    res.render("index", { reply: "Oops, something went wrong. Please try again later.", userPrompt: userMessages[0].content });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
