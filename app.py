from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import os

app = Flask(__name__)

# Load your trained models (adjust paths as needed)
models = {}
model_names = {
    'logistic': 'Multinomial Logistic Regression',
    'random_forest': 'Random Forest',
    'xgboost': 'XGBoost',
    'neural': 'Neural Network',
    'naive_bayes': 'Naive Bayes'
}

# Load the vectorizer (you should save this when training your models)
# vectorizer = pickle.load(open('models/tfidf_vectorizer.pkl', 'rb'))

# Load language labels (you should have these from your training)
languages = ['English', 'Spanish', 'French', 'German', 'Italian', 
             'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Arabic']

def load_models():
    """Load all trained models"""
    try:
        # Load each model if it exists
        model_files = {
            'logistic': 'models/logistic_model.pkl',
            'random_forest': 'models/random_forest_model.pkl',
            'xgboost': 'models/xgboost_model.pkl',
            'neural': 'models/neural_network_model.pkl',
            'naive_bayes': 'models/naive_bayes_model.pkl'
        }
        
        for model_key, model_path in model_files.items():
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    models[model_key] = pickle.load(f)
                print(f"Loaded {model_key} model")
    except Exception as e:
        print(f"Error loading models: {e}")

def preprocess_text(text):
    """Basic text preprocessing"""
    # Convert to lowercase
    text = text.lower()
    # Remove special characters but keep letters and spaces
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', 
                         models=model_names,
                         languages=languages)

@app.route('/detect', methods=['POST'])
def detect_language():
    """API endpoint for language detection"""
    try:
        data = request.json
        text = data.get('text', '')
        model_choice = data.get('model', 'logistic')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Preprocess the text
        processed_text = preprocess_text(text)
        
        # Here you would:
        # 1. Transform text using your vectorizer
        # 2. Get prediction from selected model
        # 3. Return the result
        
        # For demonstration, I'll create a simple rule-based detection
        # Replace this with your actual model prediction logic
        detected_lang = simple_rule_based_detection(text)
        confidence = np.random.uniform(0.75, 0.99)
        
        # Get probabilities for all languages (mock data - replace with actual model output)
        probabilities = {}
        for lang in languages:
            if lang == detected_lang:
                probabilities[lang] = confidence
            else:
                probabilities[lang] = np.random.uniform(0.01, 0.20)
        
        # Normalize probabilities
        total = sum(probabilities.values())
        probabilities = {k: v/total for k, v in probabilities.items()}
        
        return jsonify({
            'success': True,
            'text': text[:100] + '...' if len(text) > 100 else text,
            'detected_language': detected_lang,
            'model_used': model_names.get(model_choice, model_choice),
            'confidence': float(confidence),
            'probabilities': probabilities,
            'all_languages': languages
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def simple_rule_based_detection(text):
    """Simple rule-based detection for demonstration"""
    # Common words in different languages
    patterns = {
        'English': r'\b(the|and|is|in|to|of|for|with|on|at)\b',
        'Spanish': r'\b(el|la|y|en|de|por|para|con|porque|como)\b',
        'French': r'\b(le|la|et|est|dans|pour|avec|mais|ou|donc)\b',
        'German': r'\b(der|die|und|ist|in|zu|mit|für|auf|bei)\b',
        'Italian': r'\b(il|la|e|è|in|per|con|su|da|che)\b',
        'Portuguese': r'\b(o|a|e|em|de|para|com|por|como|mais)\b',
        'Russian': r'[а-яА-Я]',
        'Chinese': r'[\u4e00-\u9fff]',
        'Japanese': r'[\u3040-\u30ff\u3400-\u4dbf]',
        'Arabic': r'[\u0600-\u06ff]'
    }
    
    scores = {}
    for lang, pattern in patterns.items():
        matches = len(re.findall(pattern, text.lower()))
        scores[lang] = matches
    
    return max(scores, key=scores.get) if max(scores.values()) > 0 else 'Unknown'

@app.route('/models-info')
def models_info():
    """Get information about available models"""
    return jsonify({
        'available_models': list(model_names.keys()),
        'model_names': model_names
    })

if __name__ == '__main__':
    load_models()
    app.run(debug=True, port=5000)

