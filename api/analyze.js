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

    // Extraction automatique de l'URL LeBonCoin même si elle est perdue au milieu d'un texte de partage
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
          console.log("Erreur lors de la lecture du lien URL via Jina.");
        }
      }
    }

    // Initialisation du SDK Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const systemInstructions = `Tu es un expert mécanicien et analyste de marché moto. À partir de l'annonce fournie, tu dois donner un avis ultra-précis. 
Réponds obligatoirement et strictement selon ce format pour séparer les onglets :

---RESUME_RAPIDE---
- 💰 Prix actuel vs Estimation : (Dis si le prix demandé est trop haut, correct ou une affaire, et donne une estimation réaliste de ce qu'elle devrait valoir).
- 🛣️ Kilométrage & Usure : (Dis si le kilométrage est élevé pour l'année et si c'est risqué).
- ⚠️ Gros frais à venir : (Les grosses révisions ou pièces d'usure imminentes : ex: kit chaîne, pneus, soupapes, vidange de fourche).
- 🎯 Verdict final : (Fonce / Négocie à [X] € / Fuis).

---RAPPORT_DETAILLE---
1. 💸 **Évaluation du prix & Cote du marché :** Analyse le prix affiché face à l'année et au kilométrage. Donne une fourchette de prix réaliste pour ce modèle sur le marché de l'occasion.
2. ⚙️ **Analyse du kilométrage & des révisions :** En fonction du kilométrage actuel, liste les révisions majeures qui ont dû être faites ou qui approchent à grands pas (et leur coût estimé).
3. 🛠️ **Défauts chroniques & Pièges du modèle :** Cite les pannes connues, les vices cachés ou les problèmes moteurs répertoriés sur cette moto et cette année précise.
4. 🔍 **Points de contrôle spécifiques & Négociation :** Ce qu'il faut inspecter en priorité sur place et les arguments précis pour faire baisser le prix.`;

    const result = await model.generateContent(`${systemInstructions}\n\nVoici l'annonce :\n${adContent}`);
    const responseText = result.response.text();

    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'annonce." });
  }
}
