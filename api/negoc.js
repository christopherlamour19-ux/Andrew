async function sendNegocMessage() {
    const input = document.getElementById('negoc-input');
    const container = document.getElementById('negoc-messages');
    const text = input.value.trim();
    if (!text) return;

    // Affiche ton message
    container.innerHTML += `<div class="negoc-msg user">${text}</div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Affiche le loader d'attente
    const loadingId = 'loading-' + Date.now();
    container.innerHTML += `<div class="negoc-msg bot" id="${loadingId}"><i class="fa-solid fa-spinner fa-spin"></i> Réflexion stratégique...</div>`;
    container.scrollTop = container.scrollHeight;

    try {
        // Appel vers ton backend /api/negoc (ou /api/analyze)
        const response = await fetch('/api/negoc', { // Mets /api/analyze si tu utilises cette route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (!response.ok) throw new Error(data.error || 'Erreur serveur');

        // Affiche la vraie réponse renvoyée par ton IA
        container.innerHTML += `
            <div class="negoc-msg bot">
                <strong>💡 Coach Négociation :</strong><br>
                ${data.result.replace(/\n/g, '<br>')}
            </div>
        `;
    } catch (error) {
        document.getElementById(loadingId).remove();
        container.innerHTML += `<div class="negoc-msg bot" style="color: #ef4444;">Erreur : ${error.message}</div>`;
    }
    
    container.scrollTop = container.scrollHeight;
}
