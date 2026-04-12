export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  try {
    // Parse request body
    const body = await new Promise<any>((resolve, reject) => {
      let data = "";
      req.on("data", (chunk: any) => (data += chunk));
      req.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
      req.on("error", reject);
    });

    // Build Groq messages array
    const messages: any[] = [];

    // Add system message if provided
    if (body.system) {
      messages.push({ role: "system", content: body.system });
    }

    // Add conversation messages
    if (body.messages && Array.isArray(body.messages)) {
      for (const msg of body.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Call Groq API
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: body.max_tokens || 1000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

    const groqData = await groqRes.json();

    // Convert Groq response format to Anthropic format so frontend works unchanged
    const text = groqData.choices?.[0]?.message?.content || "";
    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}