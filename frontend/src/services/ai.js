export async function classifyBatch(bookmarks, apiKey, categories) {
    const prompt = `
    Classify these ${bookmarks.length} bookmarks.
    Categories: ${JSON.stringify(categories)}
    
    Return JSON object: { "classified": [ {title, url, category, sub_category} ] }
    PRESERVE ALL FIELDS.
    
    Bookmarks:
    ${JSON.stringify(bookmarks.map(b => ({ title: b.title, url: b.url })))}
    `;

    const maxRetries = 3;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            // OpenRouter
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001",
                    messages: [
                        { role: "system", content: "You are a precise JSON generator. Output only valid JSON. Do not use Markdown blocks." },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            if (content.includes("```")) {
                content = content.replace(/```json/g, "").replace(/```/g, "");
            }

            const parsed = JSON.parse(content);
            return parsed.classified || [];

        } catch (err) {
            console.error(`Attempt ${i + 1} failed:`, err);
            if (i === maxRetries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

