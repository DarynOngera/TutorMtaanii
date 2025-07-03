
TutorMtaani – Personalized AI Tutor via WhatsApp

TutorMtaani is an AI-powered educational assistant accessible through WhatsApp. It uses Groq’s LLaMA 3 models to recommend curated learning resources based on a user’s skill level, learning goal, and topic interest. Built for accessibility and simplicity, it also includes a reminder agent that follows up after a learning session.


---

Features

📚 Personalized learning resource recommendations

💬 Natural conversation support (via WhatsApp or Web UI)

⏰ Reminder agent to follow up on selected resources (via WhatsApp)

⚡ Fast responses using Groq’s LLaMA 3 models

🔒 Lightweight local storage or Firebase support

🧠 Agentic architecture ready for scaling (MCP compatible)



---

Tech Stack

Node.js + Express.js

Twilio API for WhatsApp Messaging

Groq API (LLaMA 3)

EJS frontend for local testing

LocalStorage / Firebase (ReminderAgent)

ngrok (for tunneling localhost to public URL)


---

Setup

1. Clone this repo:



git clone https://github.com/DarynOngera/tutormtaani.git
cd tutormtaani

2. Install dependencies:



npm install

3. Configure .env file:



GROQ_API_KEY=your_groq_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

4. Start the server:



node index.js

5. Tunnel with ngrok:



ngrok http 3000

6. Configure your Twilio WhatsApp Sandbox webhook:



Incoming Messages URL: https://your-ngrok-url/webhook

Method: POST



---

MVP Usage

Send messages to your Twilio Sandbox number on WhatsApp.

The bot will reply with either:

A curated list of learning resources

A follow-up conversational response


The Reminder Agent will message you 12–24 hours later with a reminder.



---

Hackathon Goals (Achieved)

[x] Personalized AI-powered learning assistant

[x] WhatsApp integration

[x] Resource curation

[x] Reminder follow-up agent

[x] Browser CLI test mode

[x] MCP-ready backend



---

Future Improvements

Firebase authentication and multi-user support

WhatsApp-based quiz & feedback loop

Telegram + Email channels

Agentic persona upgrades and memory chaining
