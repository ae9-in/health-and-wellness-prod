import { Request, Response } from 'express';
import groq from '../lib/groq';

export const generateAIPlan = async (req: Request, res: Response) => {
  try {
    const { goal, ageGroup, gender, dietPreference, activityLevel, focusArea } = req.body;

    if (!goal || !ageGroup || !gender || !dietPreference || !activityLevel || !focusArea) {
      return res.status(400).json({ error: 'All questionnaire fields are required.' });
    }

    const systemPrompt = `You are a professional AI health assistant for Wellspring, a health and wellness platform.
    Your task is to provide structured, practical, and safe health advice.
    
    RESPONSE FORMAT:
    You must respond ONLY with a JSON array of objects. Each object represents a health category.
    Format: [{"category": "Category Name", "content": "Markdown formatted content"}]
    
    AVAILABLE CATEGORIES (Use ONLY the relevant ones from this list):
    🥗 Nutrition & Diet
    💪 Fitness & Workout
    🧘 Mental Wellness
    🧘‍♀️ Yoga & Breathing
    🌿 Ayurveda
    🌱 Herbal Products
    💊 Supplements
    
    RULES:
    1. Detect which categories are relevant to the user's question and goals.
    2. Respond ONLY for the relevant categories.
    3. The "content" field should use Markdown (**bold**, lists, ### headings, etc.).
    4. Do not include any text outside the JSON array.
    5. Ensure the JSON is valid.
    6. Incorporate the user's details into the content naturally.`;

    const userPrompt = `User Details:
Goal: ${goal}
Age: ${ageGroup}
Gender: ${gender}
Diet: ${dietPreference}
Activity Level: ${activityLevel}
Focus: ${focusArea}

Generate a personalized health plan focusing on the relevant categories from the list provided.`;

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
      temperature: 0.6, // Slightly lower temperature for more consistent JSON
      max_tokens: 3000,
      response_format: { type: "json_object" } // Experimental but helps orient the model
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || '[]';
    
    // Safety check: if the model returned a wrapper object like { "plan": [...] } or { "response": [...] }, extract the array
    try {
      const parsed = JSON.parse(aiResponse);
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        const values = Object.values(parsed);
        const arrayFound = values.find(val => Array.isArray(val));
        if (arrayFound) {
          aiResponse = JSON.stringify(arrayFound);
        }
      }
    } catch (e) {
      console.error("JSON Parse Error in AI response:", e);
    }

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
  
      const systemPrompt = `You are a certified AI Health Assistant for Wellspring. Answer the user's follow-up question based on their previous health plan context. 
      Keep it practical, safe, and include Indian context where relevant. 
      Use proper Markdown for formatting (bold, lists, etc.). Do NOT display raw markdown symbols like **.
      Do NOT give medical diagnosis.`;
  
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
