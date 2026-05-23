import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
router.use(protect);

// ── Anthropic client (only if key is set) ────────────────────────────────────
const hasApiKey =
  !!process.env.ANTHROPIC_API_KEY &&
  process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';

const anthropic = hasApiKey
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ── System prompt — strict wellness persona ───────────────────────────────────
const SYSTEM_PROMPT = `You are a warm, knowledgeable AI wellness assistant for HealthTrack360, a personal health tracking app.

Your areas of expertise:
- Sleep hygiene and sleep disorders
- Nutrition, diet planning and healthy eating habits
- Fitness, exercise routines and workout guidance
- Stress, anxiety and mental wellness management
- Skincare routines and skin health
- Gut health and digestion
- Hydration and water intake
- Weight management (healthy and sustainable approaches)
- Meditation, mindfulness and breathing techniques
- Energy levels, fatigue and lifestyle optimization
- Habit building and wellness streaks
- General preventive health tips

Guidelines:
- Be warm, supportive and encouraging — like a knowledgeable friend
- Give specific, actionable advice with bullet points where helpful
- Keep responses concise but complete (max 300 words)
- Always add a disclaimer for serious medical conditions to consult a doctor
- Use relevant emojis sparingly to make responses friendly
- If asked about something completely unrelated to health/wellness, politely redirect:
  "I'm focused on health and wellness topics — let me know if you have any questions about sleep, nutrition, fitness, skincare, or mental wellbeing!"
- Never diagnose medical conditions or prescribe medications
- Address the user personally and warmly`;

// ── Fallback knowledge base (used when no API key) ───────────────────────────
const fallback: Record<string, string> = {
  sleep: `Here are evidence-based sleep improvement tips:\n\n• Aim for 7–9 hours every night\n• Keep a consistent bedtime and wake time, even on weekends\n• Avoid screens 1 hour before bed — blue light blocks melatonin\n• Keep your room cool (18–20°C), dark and quiet\n• Avoid caffeine after 2 PM\n• Try 4-7-8 breathing: inhale 4s → hold 7s → exhale 8s\n• Avoid large meals within 2 hours of sleeping\n\nConsistency is the single biggest factor — your body loves routine! 🌙`,

  anxiety: `Managing stress and anxiety effectively:\n\n• Practice box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s\n• Exercise at least 30 minutes daily — it's a natural anxiety reducer\n• Keep a gratitude journal — write 3 things you're grateful for daily\n• Limit caffeine and alcohol — both worsen anxiety significantly\n• Try the 5-4-3-2-1 grounding technique when overwhelmed\n• Talk to a trusted person or mental health professional if it persists\n\nRemember: anxiety is very manageable. You're not alone 💙`,

  diet: `Nutrition advice for better wellness:\n\n• Eat whole foods — fruits, vegetables, lean proteins, whole grains\n• Stay hydrated — aim for 2.5 litres of water daily\n• Never skip breakfast — it fuels your brain and metabolism\n• Eat slowly — it takes 20 minutes to feel full\n• Reduce processed food, sugar and fried items\n• Add probiotics (yoghurt, curd) for gut health\n• Include protein with every meal for sustained energy\n\nSmall consistent changes beat extreme diets every time! 🥗`,

  skin: `Skincare tips from your wellness assistant:\n\n• Cleanse gently twice daily — morning and night\n• Apply SPF 30+ sunscreen every morning, even indoors\n• Stay well hydrated — dehydration shows on skin first\n• Change pillowcase twice a week to reduce bacteria\n• Moisturise immediately after washing your face\n• Eat antioxidant-rich foods: berries, leafy greens, nuts\n• Get enough sleep — it truly is called beauty sleep for a reason!\n\nYour skin reflects your overall health ✨`,

  gut: `Gut health — your second brain! Tips to improve it:\n\n• Eat more fibre — oats, beans, fruits, vegetables daily\n• Add fermented foods: yoghurt, curd, kimchi, kefir\n• Drink at least 2.5 litres of water daily\n• Reduce stress — the gut-brain connection is very real\n• Eat slowly and chew food thoroughly\n• Limit processed foods and refined sugar\n• Regular exercise improves gut motility significantly\n\nA healthy gut = stronger immunity + better mood 🌿`,

  fitness: `Fitness tips for sustainable habits:\n\n• Start small — even 15-minute walks count and matter!\n• Aim for 150 minutes of moderate exercise per week\n• Mix cardio, strength training and flexibility work\n• Warm up 5 minutes before every session\n• Rest days are as important as workout days\n• Find activities you genuinely enjoy — consistency beats intensity\n• Increase intensity gradually — 10% rule per week\n\nThe best workout is the one you actually do! 💪`,

  energy: `Boost your energy levels naturally:\n\n• Stay hydrated — even mild dehydration causes fatigue\n• Get morning sunlight within 30 minutes of waking\n• Exercise regularly — it paradoxically increases energy\n• Limit refined sugar — it causes energy crashes\n• Sleep consistently 7–9 hours every night\n• Take short 5-minute breaks every hour of work\n• Check Vitamin D and B12 levels — deficiency causes chronic fatigue\n\nMost fatigue is lifestyle-related and very fixable! ⚡`,

  meditation: `Meditation and mindfulness guide:\n\n• Start with just 5 minutes daily — consistency beats duration\n• Try simple breath focus: count breaths 1 to 10, then repeat\n• Use body scan meditation before sleep for deep relaxation\n• Find a quiet spot and a consistent time each day\n• Don't try to stop thoughts — just observe them without judgment\n• Benefits appear within 2 weeks of daily practice\n• Walking meditation is great for beginners\n\nMeditation is a skill that gets easier with practice 🧘`,

  default: `Hi! I'm your HealthTrack360 AI wellness assistant 🌟\n\nI can help you with:\n\n• 😴 Sleep improvement\n• 🧘 Stress and anxiety management\n• 🥗 Nutrition and diet advice\n• ✨ Skincare guidance\n• 🫃 Gut health improvement\n• 💪 Fitness and exercise planning\n• ⚡ Energy and fatigue solutions\n• 🧠 Meditation and mindfulness\n• ⚖️ Healthy weight management\n\nTry asking something like:\n"How do I sleep better?"\n"Tips to reduce anxiety?"\n"What should I eat for more energy?"\n\nI'm here 24/7 to support your wellness journey! 💙`,
};

function keywordFallback(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('sleep') || m.includes('insomnia'))           return fallback.sleep;
  if (m.includes('anxiety') || m.includes('stress') || m.includes('worried')) return fallback.anxiety;
  if (m.includes('diet') || m.includes('food') || m.includes('eat') || m.includes('nutrition')) return fallback.diet;
  if (m.includes('skin') || m.includes('acne') || m.includes('pimple'))       return fallback.skin;
  if (m.includes('gut') || m.includes('digest') || m.includes('bloat'))       return fallback.gut;
  if (m.includes('workout') || m.includes('exercise') || m.includes('gym') || m.includes('fitness')) return fallback.fitness;
  if (m.includes('energy') || m.includes('tired') || m.includes('fatigue') || m.includes('exhausted')) return fallback.energy;
  if (m.includes('meditat') || m.includes('mindful') || m.includes('calm') || m.includes('breathe'))  return fallback.meditation;
  return fallback.default;
}

// ── POST /api/v1/ai/chat ──────────────────────────────────────────────────────
router.post('/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message?.trim())
    return res.status(400).json({ success: false, message: 'Message is required.' });

  // ── Real AI path ─────────────────────────────────────────────────────────
  if (anthropic) {
    try {
      // Build conversation history for multi-turn context
      const priorMessages: Anthropic.MessageParam[] = (history || [])
        .slice(-10) // keep last 10 turns to stay within token limits
        .map((m: { role: string; text: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001', // fast + cheap, perfect for chat
        max_tokens: 600,
        system:     SYSTEM_PROMPT,
        messages:   [
          ...priorMessages,
          { role: 'user', content: message.trim() },
        ],
      });

      const reply = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('');

      return res.json({ success: true, reply, powered_by: 'claude' });
    } catch (err: any) {
      console.error('Anthropic API error:', err.message);
      // Fall through to keyword fallback on API error
    }
  }

  // ── Fallback path (no key or API error) ──────────────────────────────────
  setTimeout(() => {
    res.json({
      success:    true,
      reply:      keywordFallback(message),
      powered_by: 'fallback',
    });
  }, 400);
});

// ── GET /api/v1/ai/status — lets frontend know if real AI is active ───────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({ success: true, ai_enabled: hasApiKey });
});

export default router;
