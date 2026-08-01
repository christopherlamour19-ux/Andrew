export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    let adContent = prompt;

    // Tentative de lecture du lien, mais sécurisée pour ne pas faire tout planté si bloqué
    if (prompt) {
      const urlMatch = prompt.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const extractedUrl = urlMatch[0];
        try {
          const jinaResponse = await fetch(`https://r.jina.ai/${extractedUrl}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (jinaResponse.ok) {
            const text = await jinaResponse.text();
            if (text && text.length > 100) {
              adContent = text;
            }
          }
        } catch (e) {
          console.log("Impossible de scraper l'URL directement, utilisation du texte brut.");
        }
      }
    }

    const systemInstructions = `Tu es un expert mécanicien et acheteur de motos d'occasion.
Analyse l'annonce suivante et réponds obligatoirement et strictement selon ce format pour séparer les onglets :

---RESUME_RAPIDE---
- 💰 Prix : (Analyse rapide du prix et donne moi un prix)
- 🛣️ Kilométrage : (si les kilometrage pose problème a l'avenir ou les grosses revisions bientot a faire, y'a t il des choses a changer prochainement ect)
- ⚠️ Piège majeur : (Le point noir sur la moto, moteur parti cycle le kilometrage grosse revision ou pas prochainement)
- 🎯 Verdict final : (Fonce / Négocie / Fuis)

---RAPPORT_DETAILLE---
1. 💰 Prix & Argus : Est-ce un bon prix en détail ?
2. 🛣️ Kilométrage : Normal ou trop élevé pour l'année ?
3. ⚠️ Points d'attention : Quels problèmes mécaniques connus surveiller pour ce modèle/année ?
4. ❓ Questions à poser au vendeur lors de la visite.`;

    const response = await fetch('https://gateway.ai.vercel.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: `Voici l'annonce / les informations :\n${adContent}` }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur de la passerelle AI Gateway');
    }

    const responseText = data.choices[0].message.content;
    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse." });
  }
}
