module.exports = async function (req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { word } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `For the word "${word}", provide:\nTelugu Word: [translation]\nTelugu Meaning: [meaning in Telugu]\nEnglish Meaning: [definition]\nSynonyms: [synonyms]\nUse Case 1: [example]\nUse Case 2: [example]` }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(response.status).json({ error: data });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      return res.status(500).json({ error: "No result from API" });
    }
    
    res.status(200).json({ result });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Server Error: " + error.message });
  }
};
