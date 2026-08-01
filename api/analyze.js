import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { mode, prompt, profile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // On utilise le nom standard validé par le SDK Google
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // CAS 1 : ANNONCE (Ton code d'origine intact et fonctionnel)
    if (mode === 'ad' || !mode) {
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
      return res.status(200).json({ result: result.response.text() });
    }

    // CAS 2 : SIMULATEUR PROFIL
    if (mode === 'simulator') {
      const { ageRange, height, style, license, budget } = profile;

      const simPrompt = `Tu es un conseiller expert en choix de moto. Un utilisateur recherche sa moto idéale selon son profil précis :
      - Tranche d'âge : ${ageRange}
      - Taille : ${height}
      - Style de moto recherché : ${style}
      - Permis : ${license}
      - Budget maximum : ${budget}

      Fournis une recommandation claire et structurée ainsi :
      ---MOTO_IDEALE---
      - 🏍️ Modèle conseillé : (Nom exact de la moto, année, cylindrée)
      - 💡 Pourquoi ce choix : (Explique en quelques lignes pourquoi elle correspond à son style ${style}, sa taille, son permis ${license} et son budget)
      - 🛡️ Assurance & Conso : (Analyse rapide de l'assurance pour son profil et la consommation réelle)
      - ⚠️ Points de vigilance : (Les pièges ou défauts connus de ce modèle à surveiller)
      - 🔍 Recherche photo : Donne un terme de recherche précis en anglais pour trouver une belle photo de cette moto (ex: "Yamaha MT-07 2022 studio shot") sur une ligne commençant par PHOTO_QUERY: [ton terme ici].`;

      const result = await model.generateContent(simPrompt);
      const text = result.response.text();

      let photoQuery = "motorcycle studio";
      const queryMatch = text.match(/PHOTO_QUERY:\s*(.*)/);
      if (queryMatch) {
        photoQuery = queryMatch[1].trim();
      }

      const encodedQuery = encodeURIComponent(photoQuery);
      const motoImageUrl = `https://pollinations.ai/p/${encodedQuery}?width=800&height=500&nologo=true`;

      return res.status(200).json({ 
        result: text, 
        imageUrl: motoImageUrl 
      });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors du traitement." });
  }
}
