import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pznorvhjaczmhaybneesk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bm9ydmhqY3ptaGF5Ym5lZXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1OTcxODQsImV4cCI6MjEwMTE3MzE4NH0.E5SzQyklK9pfzb__vZBwPB6ItyLSOSnoaUB0moHhUh4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt, userId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    let adContent = prompt;

    // Extraction automatique de l'URL LeBonCoin
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

    // Initialisation du SDK Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    // Sauvegarde dans l'historique si l'utilisateur est connecté (userId fourni)
    if (userId) {
      // Extraction d'un titre simple pour la moto (ex: les 50 premiers caractères ou la ligne de prompt)
      const motoTitle = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;

      await supabase.from('search_history').insert([
        {
          user_id: userId,
          moto_title: motoTitle,
          full_result: responseText
        }
      ]);
    }

    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'annonce." });
  }
}
