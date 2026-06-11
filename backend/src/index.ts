import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = new Hono();

// เปิด CORS ให้ Frontend ฝั่ง Vite เข้าถึงได้
app.use("/api/*", cors());

app.post("/api/chat", async (c) => {
  // ดึง API Key จาก Environment Variable (ตั้งค่าใน wrangler.toml หรือ Cloudflare Dashboard)
  const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  try {
    const body = await c.req.parseBody();
    const message = body["message"] as string;
    const imageFile = body["image"] as File | undefined;

    let promptParts: any[] = [message];

    // ถ้ามีการส่งรูปภาพมาด้วย
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();

      // แปลง ArrayBuffer เป็น Base64 ด้วย Standard Web API (ไม่ต้องง้อ Node.js Buffer)
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: imageFile.type,
        },
      });
    }

    // System Instruction สำหรับ Give Me Food
    const systemPrompt = `You are the "Give Me Food" Autonomous Agent.
    You must always reply in JSON format with the following structure:
    {
      "replyText": "Your friendly English message acknowledging the food donation and stating the micro-fee.",
      "hasData": true or false,
      "foodInfo": {
        "item": "extracted food item name in English",
        "quantity": "extracted quantity, default to '1 unit' if not specified",
        "expiry": "estimated expiry date based on food condition",
        "microFee": "$0.01", 
        "carbonSavedKg": 1.5
      }
    }
    
    Rules for Micro-fee and Carbon:
    1. If food details are found, calculate a "microFee" between $0.01 to $0.05 (to prevent spam).
    2. Estimate "carbonSavedKg" (e.g., 1.2 for fruits, 2.5 for meat) to show environmental impact.
    3. Always keep "replyText" inspiring, polite, and strictly in English.`;

    const result = await model.generateContent([systemPrompt, ...promptParts]);
    const response = await result.response;

    return c.json({ text: response.text() });
  } catch (error) {
    console.error(error);
    return c.json({ error: error.message || error.toString() }, 500);
  }
});

export default app;
