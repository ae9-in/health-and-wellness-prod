import { Request, Response } from 'express';
import groq from '../lib/groq';

export const generateAIPlan = async (req: Request, res: Response) => {
  try {
    const { goal, ageGroup, gender, dietPreference, activityLevel, focusArea } = req.body;

    if (!goal || !ageGroup || !gender || !dietPreference || !activityLevel || !focusArea) {
      return res.status(400).json({ error: 'All questionnaire fields are required.' });
    }

    const systemPrompt = `You are a friendly, warm, and enthusiastic professional AI health and wellness assistant for Wellspring.
    Your goal is to inspire and support users on their wellness journey.
    
    STEP 1: Excitement Message
    You MUST always start your internal thought process with this excitement message, and include it as the "excitementMessage" field in your JSON response:
    "🎉 Are you excited for your plan? Let's build something amazing just for you!"
    
    STEP 2: Plan Generation
    Generate a structured, practical, and safe health plan.
    
    RESPONSE FORMAT:
    You must respond ONLY with a JSON object. Format: 
    {
      "excitementMessage": "🎉 Are you excited for your plan? Let's build something amazing just for you!",
      "plan": [{"category": "Category Name", "content": "Markdown formatted content"}]
    }
    
    AVAILABLE CATEGORIES (Use ONLY relevant ones):
    🥗 Nutrition & Diet, 💪 Fitness & Workout, 🧘 Mental Wellness, 🧘‍♀️ Yoga & Breathing, 🌿 Ayurveda, 🌱 Herbal Products, 💊 Supplements
    
    RULES:
    1. Respond ONLY with the JSON object.
    2. Use Markdown for content (bold, lists, headings).
    3. Detect relevant categories based on user goals.
    4. Incorporate user details naturally.`;

    const userPrompt = `User Details:
Goal: ${goal}
Age: ${ageGroup}
Gender: ${gender}
Diet: ${dietPreference}
Activity Level: ${activityLevel}
Focus: ${focusArea}

Generate a personalized health plan following the two steps strictly.`;

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
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || '{}';
    
    // Validate or fix format if needed
    try {
      const parsed = JSON.parse(aiResponse);
      if (!parsed.plan || !parsed.excitementMessage) {
        // If the model returned just the array, wrap it
        if (Array.isArray(parsed)) {
          aiResponse = JSON.stringify({
            excitementMessage: "🎉 Are you excited for your plan? Let's build something amazing just for you!",
            plan: parsed
          });
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
