export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredient, servings, month } = req.body;

    // API key desde variables de entorno
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Eres chef gourmet argentina. "${ingredient}" para ${servings} personas en ${month}. IMPORTANTE: Responde SOLO JSON, EXACTAMENTE 2 recetas:
[{"nombre":"Nombre","dificultad":"Fácil","tiempo":"20min","tecnica":"Técnica","ingredientes":["ing1-cant","ing2-cant","ing3-cant","ing4-cant","ing5-cant"],"guarnicion":"Descripción","nutricion":{"calorias":350,"proteinas":"28g","carbohidratos":"25g","grasas":"12g","fibra":"4g"},"tips":["Tip1","Tip2","Tip3"],"proteinaActual":"proteína"},{"nombre":"Nombre2","dificultad":"Media","tiempo":"35min","tecnica":"Técnica","ingredientes":["ing1-cant","ing2-cant","ing3-cant","ing4-cant","ing5-cant"],"guarnicion":"Descripción","nutricion":{"calorias":400,"proteinas":"35g","carbohidratos":"20g","grasas":"15g","fibra":"3g"},"tips":["Tip1","Tip2","Tip3"],"proteinaActual":"proteína"}]`
        }]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Anthropic API error: ${response.status}` 
      });
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const recipes = JSON.parse(cleanContent);
      return res.status(200).json({ recipes });
    } catch (parseError) {
      return res.status(500).json({ 
        error: 'Failed to parse recipe JSON',
        details: cleanContent.substring(0, 100)
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
