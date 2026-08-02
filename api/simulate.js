import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { profile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    const { ageRange, height, style, license, budget, displacement, experience, engineType } = profile || {};

    // Contrainte absolue pour bloquer l'IA si un type de moteur spécifique est demandé
    const engineConstraint = engineType && engineType !== "Peu importe" 
      ? `\n- ⚠️ CONTRAINTE ARCHITECTURE MOTEUR ABSOLUE : La moto recherchée DOIT IMPÉRATIVEMENT avoir un moteur de type "${engineType}". Interdit de proposer une autre architecture moteur (pas de bicylindre si monocylindre demandé, etc.).` 
      : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    // Utilisation d'un modèle flash valide (ex: gemini-2.5-flash ou gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const simPrompt = `Tu es un conseiller expert en choix de moto intransigeant. Un utilisateur recherche sa moto idéale selon son profil précis :
    - Tranche d'âge : ${ageRange}
    - Taille : ${height}
    - Style de moto recherché : ${style}
    - Permis : ${license}
    - Expérience : ${experience}
    - Cylindrée souhaitée : ${displacement}
    - Type de moteur souhaité : ${engineType}
    - Budget maximum : ${budget}

    ${engineConstraint}

    Fournis une recommandation claire et structurée ainsi :
    ---RESUME_IDEAL---
    - 🏍️ Modèle conseillé : (Nom exact de la moto, année, cylindrée)
    - 💡 Pourquoi ce choix : (Explique en quelques lignes pourquoi elle correspond à son style ${style}, sa taille, son type de moteur ${engineType}, son permis ${license} et son budget)
    - 🛡️ Assurance & Conso : (Analyse rapide de l'assurance pour son profil et la consommation réelle)
    - ⚠️ Points de vigilance : (Les pièges ou défauts connus de ce modèle à surveiller)
    ---RAPPORT_DETAILLE---
    [Développe ici une analyse technique complète : comportement moteur, position de conduite, points forts et points faibles par rapport au profil, assurance, etc.]
    
    PHOTO_QUERY: [Donne un terme de recherche précis en anglais pour trouver une belle photo de cette moto (ex: "Yamaha MT-07 2022 studio shot")]`;

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

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de la simulation." });
  }
}
