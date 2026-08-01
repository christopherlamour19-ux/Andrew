try {
    let adContent = prompt;

    // Extraction de l'URL LeBonCoin même si elle est précédée de texte (partage mobile)
    if (prompt) {
      // Expression régulière pour trouver un lien http/https dans le texte
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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    // Reste de ton code avec tes systemInstructions...
