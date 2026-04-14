import { Request, Response } from 'express';
import groq from '../lib/groq';

export const generateAIPlan = async (req: Request, res: Response) => {
  try {
    const { goal, age, weight, height, gender, dietPreference, activityLevel, focusArea } = req.body;

    if (!goal || !age || !weight || !height || !gender || !dietPreference || !activityLevel || !focusArea) {
      return res.status(400).json({ error: 'All questionnaire fields are required.' });
    }

    const systemPrompt = `You are a friendly, warm, and enthusiastic professional AI health and wellness assistant for Wellspring.
    Your goal is to inspire and support users on their wellness journey.
    
    STEP 1: Validate Details
    You have been provided with the user's exact age, weight, and height. Acknowledge these details in your plan generation.
    
    STEP 2: Excitement Message
    You MUST always start your internal thought process with this exact excitement message, and include it as the "excitementMessage" field in your JSON response:
    "🎉 Are you excited for your plan? Let's build something amazing just for you!"
    
    STEP 3: Plan Generation
    Generate a structured, practical, and safe health plan based on their physical profile. 
    
    STRICT FORMATTING RULES FOR PDF COMPATIBILITY:
    - NEVER use emojis, icons, or special symbols in the category names or content body.
    - Use ONLY plain text. Emojis cause encoding errors in PDF generation.
    - Use a simple dash (-) or asterisk (*) for bullet points. Do not use emoji bullets.
    - Title case for categories (e.g. "Nutrition and Diet" instead of "🥗 Nutrition & Diet").
    
    RESPONSE FORMAT:
    You must respond ONLY with a JSON object. Format: 
    {
      "excitementMessage": "🎉 Are you excited for your plan? Let's build something amazing just for you!",
      "plan": [{"category": "Category Name", "content": "Markdown formatted content (Plain text only, no emojis)"}]
    }
    
    AVAILABLE CATEGORIES (Use ONLY relevant ones):
    Nutrition and Diet, Fitness and Workout, Mental Wellness, Yoga and Breathing, Ayurveda, Herbal Products, Supplements
    
    RULES:
    1. Respond ONLY with the JSON object.
    2. Use Markdown for content (bold, lists, headings) but keep it emoji-free.
    3. Detect relevant categories based on user goals.
    4. Incorporate user details (Age: ${age}, Weight: ${weight}kg, Height: ${height} feet) naturally.`;

    const userPrompt = `User Details:
Goal: ${goal}
Age: ${age} years
Weight: ${weight} kg
Height: ${height} feet
Gender: ${gender}
Diet: ${dietPreference}
Activity Level: ${activityLevel}
Focus: ${focusArea}

Generate a personalized health plan following the steps strictly.`;

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
