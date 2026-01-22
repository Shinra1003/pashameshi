import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この食材を解析して、以下のJSON形式で返してください。回答はJSONオブジェクトのみにしてください： { \"name\": \"食材名\", \"genre\": \"野菜/肉/魚/など\", \"days\": 賞味期限の目安の日数(数値のみ) }",
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      // 以前動作したモデル名
      model: "meta-llama/llama-4-maverick-17b-128e-instruct", 
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content || "{}");

    // --- ここが重要：日数を日付文字列に変換する ---
    const days = parseInt(result.days) || 3; // AIの回答を数値に変換（失敗したら3日）
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    // yyyy-mm-dd 形式に変換
    const formattedDate = expiryDate.toISOString().split('T')[0];

    return NextResponse.json({
      name: result.name,
      genre: result.genre,
      expiryDate: formattedDate // CameraCapture.tsx が期待しているキー名
    });
    
  } catch (error: any) {
    console.error("AI解析エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}