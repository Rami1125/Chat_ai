import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is not defined in the environment.");
  }
  return key || '';
};

const ai = new GoogleGenAI({ 
  apiKey: getApiKey()
});

export const model = "gemini-3-flash-preview";

export interface Personality {
  persona: 'friendly' | 'professional' | 'humorous' | 'sarcastic' | 'enthusiastic' | 'concise';
  length: 'short' | 'standard' | 'detailed';
  formality: 'casual' | 'formal';
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 string
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
}

export async function* sendMessageStream(
  history: Message[], 
  message: string, 
  personality: Personality,
  attachments: Attachment[] = []
) {
  const systemInstruction = `
    זהות ותפקיד:
    אתה Noa, המוח הלוגיסטי והתבונה המלאכותית של "SabanOS" (ח. סבן חומרי בניין). תפקידך לנהל את לוח ההזמנות, ניהול לקוחות ואופטימיזציה של ההפצה.

    ניהול הזמנה חדשה (CREATE_ORDER):
    כאשר המשתמש מבקש "הזמנה חדשה", חלץ את הפרטים הבאים:
    - נהג: (חכמת/עלי).
    - מחסן: (התלמיד/החרש) - ברירת מחדל: "החרש".
    - לקוח.
    - כתובת / יעד אספקה.
    - תאריך ושעת אספקה.
    - פריט וכמות.
    
    בדיקת נתונים ואימות:
    1. אם חסרים פרטים מהותיים (מתוך הרשימה למעלה), עליך לשאול את המשתמש בצורה חברית להשלמתם.
    2. חישובים וחוקים אוטומטיים: 
      * אם הוזמנה ריצופית מעל 40 שקים: הוסף הערה "מחייב משטח סבן בפיקדון".
      * אם הוזמן בטון: ודא כמות מינימום של 6 קוב. אם חסר, ציין זאת למשתמש.

    שיתוף לקבוצת וואטסאפ (SHARE_TO_WHATSAPP):
    צור הודעה מעוצבת ונקייה עם אימוג'ים המיועדת להעתקה. המבנה המורחב:
    1. כותרת: 📅 סידור עבודה SabanOS.
    2. ריכוז נהגים ופירוט סחורה:
       עבור כל נהג (חכמת/עלי), הצג רשימה מפורטת של ההזמנות שלו:
       - [שם נהג + אימוג'י רכב מתאים]:
         * [לקוח + כתובת]: [פירוט הפריטים והכמויות]. (למשל: זבולון - אשקלון: 5 קוב בטון).
         * במידה ויש הערות מיוחדות (כמו משטח בפיקדון), הוסף אותן בסוגריים.
    3. סיכום מחסן: "העמסה עיקרית ממחסן [שם המחסן]".
    4. שורת סיכום: "סה"כ [X] הזמנות מתוכננות להיום. בהצלחה לכולם!"

    הנחיות סגנון וביצוע:
    - פנה למשתמש כ"שותף" או "אחי" בחמימות, אך שמור על דייקנות של מערכת הפעלה חכמה.
    - בסיום כל פעולה, הצג כפתורים דמיוניים (בעזרת Markdown): 
      [ייצור הודעת וואטסאפ] [עדכון לוח הפצה]
    - חובה להוסיף "SabanOS Intelligence" בסוף כל תשובה משמעותית.
    
    תמיד תגיב בעברית עם RTL תקין.
  `;

  if (!getApiKey()) {
    yield "Error: Gemini API Key is missing. Please set GEMINI_API_KEY in your settings/environment.";
    return;
  }

  const chat = ai.chats.create({
    model: model,
    history: history.map(msg => ({
      role: msg.role,
      parts: [
        { text: msg.content },
        ...(msg.attachments || []).map(att => ({
          inlineData: {
            mimeType: att.type,
            data: att.data
          }
        }))
      ]
    })),
    config: {
      systemInstruction: systemInstruction.trim()
    }
  });

  const parts: any[] = [{ text: message }];
  attachments.forEach(att => {
    parts.push({
      inlineData: {
        mimeType: att.type,
        data: att.data
      }
    });
  });

  try {
    const streamResponse = await chat.sendMessageStream({
      message: parts
    });

    for await (const chunk of streamResponse) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    const errorMsg = error.message || "";
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key expired')) {
      yield "Error: המפתח (API Key) של Gemini פג תוקף או שגוי. אנא רענן את המפתח בהגדרות (Secrets) של הפרויקט.";
    } else {
      yield "Error: חלה שגיאה בתקשורת עם Aura AI. אנא נסה שוב מאוחר יותר.";
    }
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          text: "Transcribe this audio clip accurately. If it's in Hebrew, transcribe it in Hebrew. Respond ONLY with the transcribed text, no extra commentary."
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        }
      ]
    }
  });

  return response.text || "";
}
