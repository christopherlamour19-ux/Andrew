export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Récupère l'URL du corps de la requête
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Veuillez fournir un lien Leboncoin valide.' });
  }

  const cleanUrl = url.trim();

  // Accepte www.leboncoin.fr, mobile.leboncoin.fr, leboncoin.fr, etc.
  if (!cleanUrl.includes('leboncoin.fr')) {
    return res.status(400).json({ error: 'Veuillez fournir un lien Leboncoin valide.' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Clé API OpenAI non configurée.' });
    }

    const prompt = `Analyse cette annonce Leboncoin accessible ici : ${cleanUrl}. 
    Évalue si c'est une bonne affaire. Donne :
    1. Un résumé de l'offre
    2. Une estimation de la valeur par rapport au prix affiché
    3. Les points d'attention ou pièges potentiels (ex: vice caché, prix suspect)
    4. Une note globale sur 10.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erreur OpenAI' });
    }

    const resultText = data.choices[0]?.message?.content;
    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de l'analyse de l'annonce." });
  }
}