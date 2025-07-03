import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function getGroqChatCompletion(messages) {
  const systemPrompt = {
    role: "system",
    content: "You are a personalized AI learning assistant. Your job is to help users learn topics clearly, guide them through understanding concepts, and recommend relevant learning resources. Always reply with kindness, encouragement, and clear steps or explanations."
  };

  const fullMessages = [systemPrompt, ...messages];
  console.log(`--- Sending to Groq API ---`);
  console.log(JSON.stringify(fullMessages, null, 2));

  try {
    const completion = await groq.chat.completions.create({
      messages: fullMessages,
      model: "llama3-8b-8192",
    },
    {
      timeout: 10000, // 10 seconds
    });
    console.log(`--- Received from Groq API ---`);
    console.log(JSON.stringify(completion, null, 2));
    return completion;
  } catch (error) {
    console.error("Full error in getGroqChatCompletion:", error);
    throw error; // Re-throw the error to be caught by the webhook
  }
}
