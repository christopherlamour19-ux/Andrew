import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialisation de Supabase côté serveur (avec les variables d'environnement Vercel)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Ajusté si ton modèle posait souci, remets ton ancien nom si tu préfères

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

    // Enregistrement dans Supabase si l'utilisateur est connecté et que Supabase est configuré
    if (userId && supabase) {
      await supabase.from('analyses').insert([
        { 
          userId: userId, 
          prompt: prompt, 
          result: responseText,
          created_at: new Date().toISOString()
        }
      ]);
    }

    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'annonce." });
  }
}
