import express from "express";
import dotenv from "dotenv";
import pkg from "twilio";
const { twiml } = pkg;
const MessagingResponse = twiml.MessagingResponse;
import twilio from "twilio";
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
import { getGroqChatCompletion } from "./groq3.js";
import path from "path";
import { fileURLToPath } from "url";
import { addReminder } from "./reminderAgent.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reminders = [];

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

function scheduleReminder(userId, message, delayInMs = 60 * 1000) {
  setTimeout(() => {
    // Send WhatsApp reminder via Twilio
    twilioClient.messages
      .create({
        body: `⏰ Reminder: Don't forget to revisit this resource:\n\n${message}`,
        from: 'whatsapp:+14155238886',
        to: userId // Format: 'whatsapp:+2547XXXXXXX'
      })
      .then(msg => console.log(`Reminder sent to ${userId}: ${msg.sid}`))
      .catch(err => console.error('Reminder failed:', err));
  }, delayInMs);
}


// In-memory conversation history per user
const userConversations = {};

// WhatsApp-friendly menu options
const MAIN_MENU = `Welcome! Please choose an option:\n\n1. Start or continue learning path\n2. Get a daily learning tip\n3. Take a quiz\n4. View progress\n5. Search for a resource\n6. Manage reminders\n7. Switch language\n8. Send feedback\n\nReply with the number or the option name.\nYou can type 'menu' at any time to return here.`;

function getMenuOption(text) {
  const normalized = text.trim().toLowerCase();
  if (["1", "learning path", "start", "continue"].includes(normalized)) return 1;
  if (["2", "tip", "daily tip"].includes(normalized)) return 2;
  if (["3", "quiz", "take quiz", "quiz me"].includes(normalized)) return 3;
  if (["4", "progress", "view progress"].includes(normalized)) return 4;
  if (["5", "search", "resource", "find resource"].includes(normalized)) return 5;
  if (["6", "reminder", "reminders", "manage reminders"].includes(normalized)) return 6;
  if (["7", "language", "switch language"].includes(normalized)) return 7;
  if (["8", "feedback", "send feedback"].includes(normalized)) return 8;
  if (["menu", "main menu", "help"].includes(normalized)) return 0;
  return null;
}

// WhatsApp webhook route
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;

  console.log(`Incoming message from ${from}: ${incomingMsg}`);

  // Retrieve or initialize conversation history
  if (!userConversations[from]) {
    userConversations[from] = [];
  }

  // Menu system logic
  const menuOption = getMenuOption(incomingMsg);
  const twiml = new MessagingResponse();

  if (menuOption === 0) {
    // Show main menu
    twiml.message(MAIN_MENU);
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 1) {
    // Start or continue learning path (AI tutor)
    // Add user message to conversation history
    userConversations[from].push({ role: "user", content: incomingMsg });
    try {
      const groqResponse = await getGroqChatCompletion(userConversations[from]);
      const reply = groqResponse.choices[0]?.message?.content || "Sorry, I didn’t understand that.";
      userConversations[from].push({ role: "assistant", content: reply });
      twiml.message(reply);
      res.type("text/xml").send(twiml.toString());
      reminders.push({ userId: from, message: reply, scheduledTime: Date.now() });
      scheduleReminder(from, reply);
      addReminder(from, reply);
      return;
    } catch (err) {
      console.error("Error:", err.message);
      twiml.message("Oops, something went wrong. Please try again later.");
      res.type("text/xml").send(twiml.toString());
      return;
    }
  } else if (menuOption === 2) {
    // Daily learning tip placeholder
    twiml.message("💡 Tip: Consistency is key! Try to learn a little every day, even if it's just 5 minutes.");
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 3) {
    // Quiz placeholder
    twiml.message("📝 Quiz mode coming soon! Reply with a topic to get a sample question.");
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 4) {
    // Progress placeholder
    twiml.message("📊 Progress tracking coming soon! You'll soon be able to see your learning milestones here.");
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 5) {
    // Resource search placeholder
    twiml.message("🔎 Resource search coming soon! Reply with a topic or type of resource you want.");
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 6) {
    // Reminders management placeholder
    twiml.message("⏰ Reminders management coming soon! You'll soon be able to set, view, and cancel reminders here.");
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 7) {
    // Language switch placeholder
    twiml.message("🌐 Language switching coming soon! You'll soon be able to use Swahili, Sheng, or English.");
    res.type("text/xml").send(twiml.toString());
    return;
  } else if (menuOption === 8) {
    // Feedback placeholder
    twiml.message("🙏 Feedback coming soon! You'll soon be able to send suggestions or report issues here.");
    res.type("text/xml").send(twiml.toString());
    return;
  }

  // Fallback: continue with AI tutor as before
  userConversations[from].push({ role: "user", content: incomingMsg });
  try {
    const groqResponse = await getGroqChatCompletion(userConversations[from]);
    const reply = groqResponse.choices[0]?.message?.content || "Sorry, I didn’t understand that.";
    userConversations[from].push({ role: "assistant", content: reply });
    twiml.message(reply);
    res.type("text/xml").send(twiml.toString());
    reminders.push({ userId: from, message: reply, scheduledTime: Date.now() });
    scheduleReminder(from, reply);
    addReminder(from, reply);
  } catch (err) {
    console.error("Error:", err.message);
    twiml.message("Oops, something went wrong. Please try again later.");
    res.type("text/xml").send(twiml.toString());
  }
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
