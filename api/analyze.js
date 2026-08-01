import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Si l'utilisateur colle un lien URL LeBonCoin, extraction du texte
    if (prompt && (prompt.startsWith('http://') || prompt.startsWith('https://'))) {
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${prompt}`);
        if (jinaResponse.ok) {
          adContent = await jinaResponse.text();
        }
      } catch (e) {
        console.log("Erreur lors de la lecture du lien URL.");
      }
    }

    // Initialisation du SDK Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // LA LIGNE CORRIGÉE AVEC LE MODÈLE ACTUEL EN LIGNE (2026) :
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const systemInstructions = `Tu es un expert mécanicien et acheteur de motos d'occasion.
Analyse l'annonce suivante et réponds clairement :
1. 💰 Prix & Argus : Est-ce un bon prix ?
2. 🛣️ Kilométrage : Normal ou trop élevé pour l'année ?
3. ⚠️ Points d'attention : Quels problèmes mécaniques connus surveiller pour ce modèle/année ?
4. ❓ Questions à poser au vendeur lors de la visite.`;

    const result = await model.generateContent(`${systemInstructions}\n\nVoici l'annonce :\n${adContent}`);
    const responseText = result.response.text();

    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'annonce." });
  }
}
