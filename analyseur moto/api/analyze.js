export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY; // Clé stockée en sécurité sur Vercel

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée.' });
  }

  const systemPrompt = `Tu es un expert mécanicien et acheteur de motos d'occasion.
Analyse le texte de cette annonce LeBonCoin et donne une réponse structurée :
1. 💰 **Prix & Argus** : Est-ce un bon prix d'après le marché ?
2. 🛣️ **Kilométrage** : Élevé ou normal pour l'année ?
3. ⚠️ **Points d'attention & Problèmes fréquents** : Quels soucis mécaniques connus surveiller sur cette année/modèle ?
4. ❓ **Questions à poser au vendeur** : Que vérifier sur place ?`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    const result = data.choices[0].message.content;
    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur lors de la communication avec l'IA." });
  }
}