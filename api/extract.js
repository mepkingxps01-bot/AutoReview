export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64Data, mimeType } = req.body;
  if (!base64Data || !mimeType) return res.status(400).json({ error: 'Missing base64Data or mimeType' });

  const prompt = `You are reading a Thai hospital OR (Operating Room) schedule photo.
Extract ALL patients from this schedule image.
For each patient, extract:
1. Patient full name (may be Thai or English)
2. Age (if shown next to name, e.g. "นาย สมชาย อายุ 45" → age 45)
3. HN (Hospital Number)
4. Diagnosis / DX (e.g. DME, CRVO, CNV, AMD, Cataract, etc.)
5. Operation / Procedure (e.g. IVT Avastin, Phaco, DMEK, etc.)

Return ONLY a JSON array, no other text:
[
  {"name": "...", "age": "...", "hn": "...", "dx": "...", "operation": "..."},
  ...
]

If a field is not visible, use empty string "".
Include ALL patients you can see in the schedule.`;

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
        max_tokens: 1000,
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
