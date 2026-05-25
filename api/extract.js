export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64Data, mimeType } = req.body;
  if (!base64Data || !mimeType) return res.status(400).json({ error: 'Missing base64Data or mimeType' });

  const prompt = `You are an expert at reading Thai hospital OR (Operating Room) schedule documents.
Carefully examine the entire image and extract EVERY patient listed.

For each patient extract ALL of the following:
1. name — Full patient name (Thai or English). Include title (นาย/นาง/นางสาว/ด.ช/ด.ญ etc.)
2. age — Age as a number string. Look near the name or in an age column.
3. hn — Hospital Number (HN). May be labeled HN, เลขที่, or a numeric code.
4. dx — Full diagnosis. Copy the COMPLETE text (e.g. "Proliferative Diabetic Retinopathy", "CRVO with ME", "Nuclear cataract OD"). Do NOT shorten.
5. operation — Full operation/procedure name. Copy COMPLETELY (e.g. "IVT Bevacizumab (Avastin) OD", "Phacoemulsification + IOL OS", "DMEK OD"). Do NOT shorten.

Rules:
- Include EVERY patient row you can see, even partial ones.
- Copy diagnosis and operation text EXACTLY as written — do not abbreviate or paraphrase.
- If a cell spans multiple lines, combine all lines into one string.
- If a field is missing or unreadable, use "".

Return ONLY a valid JSON array with no extra text, markdown, or explanation:
[
  {"name": "...", "age": "...", "hn": "...", "dx": "...", "operation": "..."},
  ...
]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
