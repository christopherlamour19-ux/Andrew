export default async function handler(req, res) {
  // 1. Autoriser uniquement la méthode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { url } = req.body;

  if (!url || !url.includes('leboncoin.fr')) {
    return res.status(400).json({ error: 'Veuillez fournir un lien Leboncoin valide.' });
  }

  try {
    // 2. Extraire les données de l'annonce
    // Note: Leboncoin bloque souvent les requêtes directes. Pour un projet simple,
    // on peut passer l'URL à un service comme Firecrawl/ScrapingBee, ou demander à l'utilisateur d'en coller le texte.
    
    // Exemple d'appel à l'API OpenAI (GPT-4o mini)
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `Analyse cette annonce Leboncoin accessible ici : ${url}. 
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
    const resultText = data.choices[0].message.content;

    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de l\'analyse de l\'annonce.' });
  }
}
