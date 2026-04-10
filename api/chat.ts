export default async function handler(req: any, res: any) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    // Debug: check if key exists
    if (!apiKey) {
      return res.status(500).json({ error: "API key not found in environment" });
    }
  
    try {
      const body = await new Promise<any>((resolve, reject) => {
        let data = "";
        req.on("data", (chunk: any) => data += chunk);
        req.on("end", () => resolve(JSON.parse(data)));
        req.on("error", reject);
      });
  
      body.stream = false;
  
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }