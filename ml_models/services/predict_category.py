from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the trained model once on startup
MODEL_PATH = '../models/expense_category_model.pkl'
model = joblib.load(MODEL_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    description = data.get('description', '')
    
    if not description:
        return jsonify({'error': 'Description is required'}), 400
    
    # Predict category
    pred = model.predict([description])
    category = pred[0]
    print(pred)
    
    return jsonify({'category': category})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)

