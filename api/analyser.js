// On récupère la clé depuis les variables d'environnement de Vercel
const apiKey = process.env.OPENAI_API_KEY;

const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`, // La clé est injectée automatiquement par Vercel
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert en analyse d\'annonces d\'occasion.'
      },
      {
        role: 'user',
        content: `Analyse cette annonce : ${texteAnnonce}`
      }
    ]
  })
});