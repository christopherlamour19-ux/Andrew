import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { motoA, motoB, userProfile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const duelPrompt = `Tu es RadarMoto, un expert essayeur et comparateur moto intransigeant. 
    Un utilisateur hésite entre deux modèles et te demande un duel comparatif direct.
    
    Profil de l'utilisateur (pour contextualiser le choix) :
    - Taille : ${userProfile?.height || 'Non précisée'}
    - Permis : ${userProfile?.license || 'Non précisé'}
    - Expérience : ${userProfile?.experience || 'Non précisée'}
    - Utilisation / Style : ${userProfile?.style || 'Non précisé'}

    Les deux motos en lice :
    - Moto A : ${motoA}
    - Moto B : ${motoB}

    Analyse et compare ces deux motos point par point de manière objective et percutante. Ta réponse doit suivre strictement cette structure :

    ---VERDICT_GLOBAL---
    [Dis clairement quelle moto gagne le duel pour ce profil en 2-3 phrases.]

    ---COMPARATIF_DETAILLE---
    - **Moteur & Performance :** [Comparaison des blocs, sensations, puissance]
    - **Partie cycle & Maniabilité :** [Comportement, poids, agilité]
    - **Ergonomie & Confort :** [Adaptation au gabarit du pilote, position]
    - **Budget & Entretien :** [Coût d'achat, assurance, consommation]

    ---VAINQUEUR---
    [Nom de la moto gagnante et résumé de la raison décisive]`;

    const result = await model.generateContent(duelPrompt);
    const text = result.response.text();

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors du duel." });
  }
}
