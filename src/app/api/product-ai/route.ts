import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key is not configured." }, { status: 500 });
    }

    const { product } = await req.json();

    if (!product) {
      return NextResponse.json({ error: "Missing product for analysis." }, { status: 400 });
    }

    const systemPrompt = `Sen Türkiye'nin en zeki alışveriş danışmanı asistanısın. Kullanıcılara bir ürünün fiyat/performans dengesini, avantajlarını ve alınabilirliğini objektif olarak analiz edersin. SADECE geçerli JSON formatında yanıt ver, başka hiçbir açıklama veya markdown yazma.`;

    const userPrompt = `Aşağıdaki ürünün detaylarını analiz et ve en doğru fiyat/performans yorumunu hazırla.
    
Adı: ${product.title}
Mevcut Fiyat: ${product.current_price} ${product.currency || "TRY"}
Orijinal Liste Fiyatı: ${product.original_price} ${product.currency || "TRY"}
Kategori: ${product.category}
Platform: ${product.source_platform}
Puan: ${product.rating || "4.5"}/5 (${product.review_count || "0"} değerlendirme)
Açıklama: ${product.description || ""}

ZORUNLU KURALLAR:
1. "bargainScore" degeri 0 ile 100 arasında bir sayı olmalı (indirim oranı ve genel piyasa değerine göre).
2. "advice" değeri şunlardan biri olmalı: "🔥 ŞİMDİ AL" (Fiyat harikaysa), "⚖️ KARARSIZ" (Normal fiyat), "⏳ BEKLE" (Daha iyi indirim beklenebilir).
3. "pros" dizisi en fazla 3 madde olmalı.
4. "cons" dizisi en fazla 2 madde olmalı.
5. "sentiment" ve "verdict" türkçe ve ikna edici olmalı.
6. Sadece JSON döndür.

YANIT FORMATI:
{
  "bargainScore": 85,
  "advice": "🔥 ŞİMDİ AL",
  "pros": [
    "İndirim oranı piyasa ortalamasının üzerinde",
    "Kullanıcı puanları çok yüksek seviyede",
    "Kategori lideri popüler bir ürün"
  ],
  "cons": [
    "Fiyat dalgalanması yüksek olabiliyor",
    "Stok seviyesi hızla tükeniyor"
  ],
  "sentiment": "Kullanıcı yorumları genel olarak ürünün malzeme kalitesinden ve kargo hızından oldukça memnun olduğunu gösteriyor.",
  "verdict": "Bu fiyat aralığında bu teknik özellikler ve indirim fırsatı kaçırılmayacak seviyede. İhtiyacınız varsa hemen almanızı tavsiye ederiz."
}`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API Error:", response.status, errText);
      return NextResponse.json({ error: `AI service error: ${response.status}` }, { status: 500 });
    }

    const groqData = await response.json();
    const rawContent = groqData.choices?.[0]?.message?.content || "{}";

    // Extract JSON: find first { and last }
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");
    let jsonString = rawContent;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = rawContent.substring(firstBrace, lastBrace + 1);
    }

    const aiData = JSON.parse(jsonString);
    return NextResponse.json(aiData);
  } catch (error) {
    console.error("AI Product Review Error:", error);
    return NextResponse.json({ error: "Failed to generate product review." }, { status: 500 });
  }
}
