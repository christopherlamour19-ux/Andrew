export default async function handler(req, res) {
  // 1. Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    let adContent = prompt;

    // 2. Si l'utilisateur colle un lien (http/https), on extrait le texte avec Jina AI
    if (prompt && (prompt.startsWith('http://') || prompt.startsWith('https://'))) {
      const jinaResponse = await fetch(`https://r.jina.ai/${prompt}`);
      if (jinaResponse.ok) {
        adContent = await jinaResponse.text();
      } else {
        return res.status(400).json({ error: "Impossible de lire le contenu de ce lien LeBonCoin." });
      }
    }

    const systemInstructions = `Tu es un expert mécanicien et acheteur de motos d'occasion.
Analyse l'annonce suivante et réponds clairement :
1. 💰 Prix & Argus : Est-ce un bon prix ?
2. 🛣️ Kilométrage : Normal ou trop élevé pour l'année ?
3. ⚠️ Points d'attention : Quels problèmes mécaniques connus surveiller pour ce modèle/année ?
4. ❓ Questions à poser au vendeur lors de la visite.`;

    // 3. Appel à l'API Gemini 2.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstructions}\n\nVoici le contenu de l'annonce :\n${adContent}` }]
        }]
      })
    });

    const data = await response.json();
    
    // Si l'API renvoie une erreur (clé invalide, modèle non disponible, etc.)
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const result = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du traitement de la requête." });
  }
}
