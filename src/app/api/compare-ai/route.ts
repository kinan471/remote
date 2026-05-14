import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key is not configured." }, { status: 500 });
    }

    const { p1, p2, p2Name } = await req.json();

    if (!p1 || (!p2 && !p2Name)) {
      return NextResponse.json({ error: "Missing products for comparison." }, { status: 400 });
    }

    const p2Title = p2 ? p2.title : p2Name;
    const p2OriginalPrice = p2 ? `${p2.original_price} ${p2.currency}` : "Bilinmiyor";
    const p2CurrentPrice = p2 ? `${p2.current_price} ${p2.currency}` : "Bilinmiyor";
    const p2Rating = p2 ? `${p2.rating}/5` : "Bilinmiyor";
    const p2Category = p2 ? p2.category : "Bilinmiyor";

    const systemPrompt = `Sen dünyanın en iyi teknoloji ürünü karşılaştırma asistanısın. Kullanıcıya kesin, veri odaklı ve objektif kararlar sunarsın. SADECE geçerli JSON formatında yanıt ver, başka hiçbir metin veya markdown yazma.`;

    const userPrompt = `Aşağıdaki iki ürünü karşılaştır. Teknik özellikler verilmemiştir — kendi bilgi tabanından bu ürünleri araştır ve gerçek donanım verilerini kullan.

ÜRÜN 1:
- Ad: ${p1.title}
- İndirimli Fiyat: ${p1.current_price} ${p1.currency}
- Orijinal Fiyat: ${p1.original_price} ${p1.currency}
- Puan: ${p1.rating}/5
- Kategori: ${p1.category}

ÜRÜN 2:
- Ad: ${p2Title}
- İndirimli Fiyat: ${p2CurrentPrice}
- Orijinal Fiyat: ${p2OriginalPrice}
- Puan: ${p2Rating}
- Kategori: ${p2Category}

ZORUNLU KURALLAR:
1. "winner" MUTLAKA 1 veya 2 olmalı
2. "comparisonTable" dizisi MUTLAKA en az 7 satır içermeli (örn: İşlemci, RAM, Ekran, Batarya, Kamera, Depolama, Fiyat/Performans)
3. Tüm string değerler dolu olmalı
4. Sadece JSON döndür

YANIT FORMATI (bu yapıyı aynen kullan, değerleri doldur):
{
  "winner": 1,
  "p1Score": 85,
  "p2Score": 72,
  "reasoning": "Ürün 1'in kazanma gerekçesi buraya.",
  "p1Sentiment": "Ürün 1 için kullanıcı yorumları özeti buraya.",
  "p2Sentiment": "Ürün 2 için kullanıcı yorumları özeti buraya.",
  "p1TargetAudience": "Ürün 1 kimin için ideal olduğu buraya.",
  "p2TargetAudience": "Ürün 2 kimin için ideal olduğu buraya.",
  "actualPerformanceComparison": "Gerçek dünya performans karşılaştırması 2-3 cümle buraya.",
  "comparisonTable": [
    { "feature": "İşlemci", "p1Value": "...", "p2Value": "...", "winner": 1 },
    { "feature": "RAM", "p1Value": "...", "p2Value": "...", "winner": 1 },
    { "feature": "Ekran", "p1Value": "...", "p2Value": "...", "winner": 2 },
    { "feature": "Ana Kamera", "p1Value": "...", "p2Value": "...", "winner": 1 },
    { "feature": "Batarya", "p1Value": "...", "p2Value": "...", "winner": 1 },
    { "feature": "Depolama", "p1Value": "...", "p2Value": "...", "winner": 0 },
    { "feature": "Fiyat/Performans", "p1Value": "...", "p2Value": "...", "winner": 1 }
  ]
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
        temperature: 0.6,
        max_tokens: 2000,
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

    console.log("Groq raw response (first 300):", rawContent.substring(0, 300));

    // Extract JSON: find first { and last }
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");
    let jsonString = rawContent;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = rawContent.substring(firstBrace, lastBrace + 1);
    }

    const aiData = JSON.parse(jsonString);

    console.log("Parsed AI keys:", Object.keys(aiData));
    console.log("comparisonTable rows:", aiData.comparisonTable?.length);

    // Map winner number to product DB id
    if (aiData.winner === 1) {
      aiData.winnerId = p1.id;
    } else if (aiData.winner === 2 && p2) {
      aiData.winnerId = p2.id;
    } else {
      aiData.winnerId = p1.id;
    }
    aiData.isClose = Math.abs((aiData.p1Score || 50) - (aiData.p2Score || 50)) <= 5;

    return NextResponse.json(aiData);
  } catch (error) {
    console.error("AI Comparison Error:", error);
    return NextResponse.json({ error: "Failed to generate comparison." }, { status: 500 });
  }
}
