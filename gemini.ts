import { GoogleGenAI } from '@google/genai';
import { UserProfile, Message } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } else {
      console.warn('GEMINI_API_KEY is not set in environment. Gemini responder is disabled.');
    }
  }
  return aiInstance;
}

export async function generateBotResponse(
  botProfile: UserProfile,
  conversationHistory: Message[],
  userProfile: UserProfile,
  isAnonymousChat: boolean = false
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    return 'Hey! I am currently offline because my AI core is not configured. But let\'s chat soon!';
  }

  // Build conversations log
  const formattedHistory = conversationHistory
    .map(m => `[${m.senderId === botProfile.id ? botProfile.username : 'User'}] ${m.content}`)
    .join('\n');

  const systemInstruction = `You are simulating a user in "VibeChat" (a social chat application part anonymous OmeTV matchmaking, part permanent Instagram-like DMs).
You must stay in character as:
- Name/Username: ${botProfile.username}
- Bio: ${botProfile.bio}
- Interests: ${botProfile.interests.join(', ')}

You are talking to:
- User Username: ${userProfile.username}
- User Bio: ${userProfile.bio}
- User Interests: ${userProfile.interests.join(', ')}

Chatting context: ${isAnonymousChat ? 'Anonymous Random Matchmaking Session (you don\'t know their identity initially, keep it causal and fun, standard OmeTV style!)' : 'Permanent Private DM Chat (you are now friends, so you can be slightly more familiar and deep!)'}

Rules for response:
1. Keep the response concise, typical of a real-time chat app. 1-2 sentences maximum.
2. Use casual spelling, internet slang, and a couple of relevant emojis if appropriate.
3. Show genuine curiosity, ask questions, or react to their previous message.
4. Do NOT output any system text, labels, or prefixes like "${botProfile.username}:". Only output the pure text message.
5. If the last message contains abusive language, politely deflect or express discomfort (Auto-moderation).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          text: `Here is the current chat log:\n${formattedHistory || '(No messages yet)'}\n\nPlease generate your next message:`
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text?.trim() || 'Yeah, totally agree!';
  } catch (e) {
    console.error('Error generating Gemini response:', e);
    return 'Oh, interesting! Tell me more about that? 😊';
  }
}

/**
 * Basic icebreaker generator to kick off chats
 */
export async function generateIcebreaker(botProfile: UserProfile, userProfile: UserProfile): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) return 'Hey, what\'s up?';

  try {
    const prompt = `Generate a creative 1-sentence icebreaker greeting from ${botProfile.username} to ${userProfile.username} based on their overlapping interests or profiles:
Bot Username: ${botProfile.username}, Interests: ${botProfile.interests.join(', ')}
User Username: ${userProfile.username}, Interests: ${userProfile.interests.join(', ')}
Keep it short, friendly, and informal. Do NOT prefix with the name. Just output the greeting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text?.trim() || 'Hey there! Nice to meet you.';
  } catch (e) {
    return 'Hey, nice matching with you! What are you up to today?';
  }
}
