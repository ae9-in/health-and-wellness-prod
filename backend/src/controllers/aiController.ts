import { Request, Response } from 'express';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'MISSING_API_KEY',
});

export const generateAIPlan = async (req: Request, res: Response) => {
  try {
    const { goal, ageGroup, gender, dietPreference, activityLevel, focusArea } = req.body;

    if (!goal || !ageGroup || !gender || !dietPreference || !activityLevel || !focusArea) {
      return res.status(400).json({ error: 'All questionnaire fields are required.' });
    }

    const systemPrompt = "You are a professional AI health assistant. Provide structured, practical, and safe health advice including diet plans, workout routines, mental wellness tips, and product suggestions.";

    const userPrompt = `User Details:
Goal: ${goal}
Age: ${ageGroup}
Gender: ${gender}
Diet: ${dietPreference}
Activity Level: ${activityLevel}
Focus: ${focusArea}

Generate:
- Diet Plan
- Workout Plan
- Mental Wellness Tips
- Supplements / Herbal Suggestions
- Product Recommendations
- Daily Tips

Keep output structured and easy to read.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || '';

    res.status(200).json({ result: aiResponse });
  } catch (error: any) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: 'Failed to generate AI plan. Please check if GROQ_API_KEY is configured.' });
  }
};

export const followUpQuestion = async (req: Request, res: Response) => {
    try {
      const { question, previousContext } = req.body;
  
      if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
      }
  
      const systemPrompt = `You are a certified AI Health Assistant. Answer the user's follow-up question based on their previous health plan context. 
      Keep it practical, safe, and include Indian context where relevant. Do NOT give medical diagnosis.`;
  
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...((previousContext || []).map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))),
          {
            role: 'user',
            content: question,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
      });
  
      const aiResponse = chatCompletion.choices[0]?.message?.content || '';
  
      res.status(200).json({ result: aiResponse });
    } catch (error: any) {
      console.error('Groq API Error:', error);
      res.status(500).json({ error: 'Failed to generate follow-up response.' });
    }
  };
