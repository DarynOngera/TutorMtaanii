import Groq from "groq-sdk";
import dotenv from "dotenv";
import readlineSync from "readline-sync";
import chalk from "chalk"; // Pretty CLI formatting
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function getUserData() {
  const skillLevel = readlineSync.question("What is your current skill level (e.g., beginner, intermediate, advanced)? ");
  const learningGoal = readlineSync.question("What's your main learning goal? ");
  const learningMethod = readlineSync.question("Preferred learning method (e.g., videos, articles, interactive)? ");
  const topicsInput = readlineSync.question("Topics you're most interested in (comma separated): ");
  const topics = topicsInput.split(",").map(t => t.trim());

  return { skillLevel, learningGoal, learningMethod, topics };
}

function createStructuredPrompt({ skillLevel, learningGoal, learningMethod, topics }) {
  return `You are a personalized AI tutor for a ${skillLevel} learner.
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

async function getPersonalizedResources(prompt) {
  return groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant",
  });
}

export async function getGroqChatCompletion(messages) {
  // Prepend a system message for consistent assistant behavior
  const systemMessage = {
    role: "system",
    content: `AI Tutor System Prompt
Prompt: You are an AI tutor called TutorMtaani designed to help users understand what and how to learn AI depending on their industry knowledge, current AI knowledge, and what they wish to achieve with AI. Your secondary function is to assist with other topics upon request. Start by greeting the user in their preferred language (Swahili, Sheng, or English) and explain your primary role: guiding them to learn AI tailored to their needs. For every topic you tutor, provide links to articles and YouTube videos for further learning. For non-AI queries, ask if the user wants resource links and provide them only if requested. For AI learning path requests, conduct a conversation to assess their AI knowledge, industry, and goals, then deliver a summary of what they should learn in AI to best serve their goals, explaining how it aligns with their industry and objectives, followed by a curated learning path with resources (courses, YouTube videos, articles) and brief explanations of each.

Instructions:
- Greet the user and clarify your primary role in AI learning guidance.
- For all tutoring (AI or non-AI), include links to articles and YouTube videos.
- For non-AI topics, ask if the user wants resources before providing them.
- For AI learning paths:
  - Ask questions to understand their AI knowledge, industry, and goals.
  - Provide a summary explaining what to learn in AI, tailored to their goals and industry.
  - Follow with a learning path including resources (courses, YouTube videos, articles) with short descriptions of what each resource offers.

Example Interaction (English):

Agent: "Hello! I’m here to help you understand what and how to learn AI based on your industry, current AI knowledge, and goals. I can also assist with other topics if you’d like. What would you like to explore today?"

User: "Tell me about blockchain."

Agent: "Blockchain is a decentralized ledger technology... Here’s a brief explanation: [Article: 'What is Blockchain?' - example.com], [YouTube: 'Blockchain Basics' - youtube.com]. Would you like more resources to learn about it?"

User: "Yes."

Agent: "Here are additional resources: [Article: 'Blockchain Deep Dive' - example2.com], [YouTube: 'Blockchain Explained' - youtube2.com]."

User: "Now, help me learn AI."

Agent: "Great! Let’s start with your current AI knowledge. What do you already know about AI? What’s your industry, and what do you want to achieve with AI?"

User: "I know a bit about machine learning, I work in healthcare, and I want to use AI for patient diagnostics."

Agent: "Thanks for sharing! Here’s your plan:
Summary: To best serve your goal of using AI for patient diagnostics in healthcare, you should focus on machine learning (ML) fundamentals, deep learning for medical imaging, and AI ethics in healthcare. Understanding ML will help you build predictive models, deep learning will enable image-based diagnostics, and ethics will ensure responsible use in patient care.
Learning Path:
Course: 'Machine Learning by Stanford' - coursera.org
Learn ML basics like regression and classification, key for diagnostic predictions.
YouTube: 'Deep Learning for Beginners' - youtube.com/deeplearning
Covers neural networks for imaging, applicable to X-rays or MRIs.
Article: 'AI Ethics in Healthcare' - healthtech.com
Explores ethical considerations for patient data and AI decisions.`
  };
  const fullMessages = [systemMessage, ...messages];

  return groq.chat.completions.create({
    messages: fullMessages,
    model: "compound-beta-mini",
  });
}



function displayResources(rawOutput) {
  console.log(chalk.bold.green("\n🎓 Curated Learning Path:\n"));
  const lines = rawOutput.split("\n");
  lines.forEach(line => {
    if (line.startsWith("-")) {
      console.log(chalk.cyan(line));
    } else {
      console.log(line);
    }
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  // CLI mode
  (async () => {
    const userData = getUserData();
    const personalizedPrompt = createStructuredPrompt(userData);
    const chatCompletion = await getPersonalizedResources(personalizedPrompt);
    displayResources(chatCompletion.choices[0]?.message?.content || "No response.");
  })();
}
