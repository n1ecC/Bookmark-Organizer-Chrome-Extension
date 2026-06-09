export async function generateSchema(bookmarks, apiKey, baseCategories, model = "google/gemini-3.5-flash") {
    const prompt = `
    Analyze these ${bookmarks.length} bookmarks. We want to organize them into a clean, concise, and non-redundant folder structure (categories and sub-categories).

    Preferred base categories: ${JSON.stringify(baseCategories)}

    Please generate a schema of categories and sub-categories. Follow these rules:
    1. Minimize the number of folders. Do not create folders with very few bookmarks if they can be grouped into a broader category.
    2. Avoid redundant, overlapping, or synonymous categories/sub-categories (e.g. do not create both "JS" and "JavaScript", or "Cooking" and "Recipes").
    3. Limit the total number of categories to at most 10.
    4. Limit the sub-categories per category to at most 4.
    5. Every category should have a sub_categories list (which can include "General" or be empty if no sub-categories are needed).

    Return JSON object:
    {
      "categories": [
        {
          "name": "Category Name",
          "sub_categories": ["Sub-category A", "Sub-category B"]
        }
      ]
    }

    Bookmarks:
    ${JSON.stringify(bookmarks.map(b => ({ title: b.title, url: b.url })))}
    `;

    const maxRetries = 3;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
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

            const parsed = JSON.parse(content.trim());
            return parsed;

        } catch (err) {
            console.error(`Attempt ${i + 1} failed:`, err);
            if (i === maxRetries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

export async function classifyBatch(bookmarks, apiKey, schema, model = "google/gemini-3.5-flash") {
    const prompt = `
    Classify these ${bookmarks.length} bookmarks.

    You MUST classify each bookmark into one of the categories and sub-categories defined in this schema:
    ${JSON.stringify(schema)}

    For each bookmark, select the most appropriate category and sub_category from the schema.
    If a bookmark does not fit any sub-category, use "General" as the sub_category.
    If a bookmark does not fit any category at all, classify it under "Other" (with sub_category "General").
    Do NOT invent any new categories or sub-categories.

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
                    model: model,
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

