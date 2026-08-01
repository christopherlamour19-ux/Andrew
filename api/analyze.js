import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
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

    // Extraction du contenu si c'est une URL LeBonCoin
    if (prompt && (prompt.startsWith('http://') || prompt.startsWith('https://'))) {
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${prompt}`);
        if (jinaResponse.ok) {
          adContent = await jinaResponse.text();
        }
      } catch (e) {
        console.log("Erreur lors de la lecture de l'URL");
      }
    }

    // Initialisation du SDK officiel Google AI
    const ai = new GoogleGenAI({ apiKey });

    const systemInstructions = `Tu es un expert mécanicien et acheteur de motos d'occasion.
Analyse l'annonce suivante et réponds clairement :
1. 💰 Prix & Argus : Est-ce un bon prix ?
2. 🛣️ Kilométrage : Normal ou trop élevé pour l'année ?
3. ⚠️ Points d'attention : Quels problèmes mécaniques connus surveiller pour ce modèle/année ?
4. ❓ Questions à poser au vendeur lors de la visite.`;

    // Le SDK s'occupe de router vers la bonne version active du modèle
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemInstructions}\n\nVoici l'annonce :\n${adContent}`,
    });

    return res.status(200).json({ result: response.text });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse." });
  }
}
