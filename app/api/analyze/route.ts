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
              text: "この食材を解析して、以下のJSON形式で返してください。回答はJSONオブジェクトのみにしてください： { \"name\": \"食材名\", \"genre\": \"野菜/肉/魚/乳製品/加工品/調味料/その他\", \"quantity\": 数値, \"unit\": \"単位(本/個/g/パック/枚など)\", \"days\": 賞味期限の目安の日数(数値のみ) }",
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-maverick-17b-128e-instruct", // Vision対応モデルを使用
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content || "{}");

    // 日付計算
    const days = parseInt(result.days) || 3;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    const formattedDate = expiryDate.toISOString().split('T')[0];

    return NextResponse.json({
      name: result.name,
      genre: result.genre,
      quantity: parseFloat(result.quantity) || 1, // 数量
      unit: result.unit || "個",                  // 単位
      expiryDate: formattedDate
    });
    
  } catch (error: any) {
    console.error("AI解析エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}