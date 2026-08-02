from flask import Blueprint, request, jsonify

# Si tu utilises des Blueprints Flask
comparator_bp = Blueprint('comparator_bp', __name__)

def init_comparator_route(app, model):
    @app.route('/api/compare', methods=['POST'])
    def api_compare():
        try:
            data = request.get_json()
            motos = data.get('motos', [])
            
            if not motos or len(motos) < 2:
                return jsonify({'error': 'Veuillez fournir au moins deux motos à comparer.'}), 400

            prompt = f"""
            Agis en tant qu'expert motard passionné et analyste technique. 
            Fais un comparatif technique, esthétique, et d'usage détaillé, structuré et percutant entre les motos suivantes (en tenant compte de leurs années respectives) :
            - {motos[0]}
            - {motos[1]}
            {f'- {motos[2]}' if len(motos) > 2 else ''}

            Structure ta réponse de manière claire avec :
            1. Un résumé rapide du duel / match.
            2. Les points forts et faiblesses de chaque modèle (selon son année).
            3. Le comparatif des performances (moteur, poids, partie cycle).
            4. Le verdict final / laquelle choisir selon le profil du pilote.
            """

            # Utilise l'instance globale de ton modèle Gemini / IA
            response = model.generate_content(prompt)
            
            return jsonify({'result': response.text})

        except Exception as e:
            return jsonify({'error': str(e)}), 500