// api/recipe/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();

    // 食材名とジャンルを組み合わせてAIに渡す
    const ingredientList = ingredients.map((i: any) => `${i.name}(${i.genre})`).join("、");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `あなたは家庭にある食材を最大限に活かすプロの料理研究家です。
          
          【料理の原則】
          - 缶詰(シーチキン等)や加工品は、そのまま和えるか、ほぐして使うこと。決して「スライス」や「切り分ける」などの指示をしないでください。
          - 「醤油、塩、味噌、マヨネーズ、ケチャップ、油、砂糖」は家庭に常備されている前提でレシピを組んで構いません。
          - 食材が少ない場合、無理に豪華なメイン料理にせず、「和え物」「即席漬け」「シンプル炒め」などの美味しい副菜を提案してください。
          - 具体的で現実的な調理工程のみを出力してください。
          
          必ず以下のJSON形式で回答してください：
          {
            "title": "現実的な料理名",
            "description": "なぜこの組み合わせにしたか（例：シーチキンの旨味をキャベツに吸わせるため）",
            "ingredients": ["材料名(分量)", "使う調味料"],
            "steps": ["具体的で正しい工程1", "具体的で正しい工程2"],
            "point": "失敗しないためのコツ"
          }`,
        },
        {
          role: "user",
          content: `現在の在庫：${ingredientList}。これで作れる、無理のない実用的なレシピを1つ提案してください。`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const recipe = JSON.parse(chatCompletion.choices[0].message.content || "{}");
    return NextResponse.json(recipe);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}