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

    if (prompt) {
      const urlMatch = prompt.match(/(https?:\/\/[^\s]+)/);
      
      if (urlMatch) {
        const extractedUrl = urlMatch[0];
        try {
          const jinaResponse = await fetch(`https://r.jina.ai/${extractedUrl}`);
          if (jinaResponse.ok) {
            adContent = await jinaResponse.text();
          }
        } catch (e) {
          console.log("Erreur lors de la lecture du lien URL.");
        }
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Correction du modèle vers une version stable et supportée
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent(`${systemInstructions}\n\nVoici l'annonce :\n${adContent}`);
    const responseText = result.response.text();

    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'annonce." });
  }
}
