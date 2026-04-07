import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function test() {
  try {
    const prompt = "You are a content moderator for a health and wellness platform. Your job is to maintain a supportive environment by blocking harmful or purely discouraging content. A comment is UNSAFE if it contains: explicit insults, hate speech, threats, sexual content, severe profanity, or is purely dismissive and discouraging without providing value (e.g., 'this is useless'). Short positive comments like 'great!', 'awesome', 'well done', 'helpful', 'thanks' and similar encouraging words are always SAFE. When in doubt, return SAFE if it is positive, but UNSAFE if it is purely malicious. Reply with only SAFE or UNSAFE: followed by a short reason.";
    
    const testComments = [
      "This is really helpful, thanks for sharing!",
      "This post is completely useless.",
      "great!",
      "You are an idiot.",
    ];

    for (const comment of testComments) {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: comment },
        ],
        model: 'llama-3.1-8b-instant',
      });
      console.log(`Comment: "${comment}" -> ${response.choices[0]?.message?.content}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

test();
