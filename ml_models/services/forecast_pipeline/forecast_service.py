# forecast_service.py
# Flask service for sequence-to-sequence LSTM forecasting

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib
from tensorflow.keras.models import load_model
from config import FILE_PATH, CATEGORY_MODEL_PATH, MODEL_PATH, SCALER_PATH
import os
from flask import current_app, make_response


# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes and all origins (you can lock this down if needed)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration constants
SEQ_LEN = 30
HORIZON = 7
FEATURE_COLS = ['log_amt', 'dow', 'is_weekend']
# MODEL_PATH = 'saved_lstm_model.h5.h5'
# SCALER_PATH = 'scaler.pkl'

# Initialize Flask app
app = Flask(__name__)

# Load trained model and scaler once at startup
model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# Preflight
@app.route("/predict", methods=["OPTIONS"])
def predict_preflight():
    resp = make_response()
    resp.headers["Access-Control-Allow-Origin"]      = "https://finpilot-pi.vercel.app"
    resp.headers["Access-Control-Allow-Methods"]     = "POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"]     = "Content-Type,Authorization"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    return resp



@app.route('/predict', methods=['POST'])
def predict():
     # Compute path however you’re doing it:
    MODEL_PATH = os.path.join(current_app.root_path, '..', 'models', 'expense_category_model .pkl')
    MODEL_PATH = os.path.normpath(MODEL_PATH)

    # Diagnostics
    print("Working directory:", os.getcwd())
    print("app.root_path   :", current_app.root_path)
    print("Looking for file at:", MODEL_PATH)
    print("Exists? ", os.path.exists(MODEL_PATH))
    if not os.path.exists(MODEL_PATH):
        files_here = os.listdir(os.path.dirname(MODEL_PATH))
        print("Files in that folder:", files_here)

    # Now load
    model = joblib.load(MODEL_PATH)
    data = request.get_json()
    description = data.get('description', '')
    
    if not description:
        return jsonify({'error': 'Description is required'}), 400
    
    # Predict category
    pred = model.predict([description])
    category = pred[0]
    resp = make_response(jsonify({'category': category}))

    # Add CORS headers to POST response
    resp.headers["Access-Control-Allow-Origin"]      = "https://finpilot-pi.vercel.app"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    return resp



@app.route('/forecast', methods=['POST'])
def forecast():
    """
    Expects JSON input with:
      {
        "series": [numeric values],    # historical daily totals (most recent last)
        // "dates" is optional; if not provided, dates are assumed to be consecutive days ending today
      }
    """
    data = request.get_json(force=True)
    series = data.get('series')
    dates = data.get('dates', None)

    # Validate series
    if not isinstance(series, list) or len(series) < SEQ_LEN:
        return jsonify({"error": f"'series' must be a list of at least {SEQ_LEN} values."}), 400

    # Generate or validate dates
    if dates is None:
        end = pd.Timestamp.today().normalize()
        start = end - pd.Timedelta(days=len(series)-1)
        dates = pd.date_range(start, periods=len(series), freq='D').strftime('%Y-%m-%d').tolist()
    else:
        if not isinstance(dates, list) or len(dates) != len(series):
            return jsonify({"error": "If provided, 'dates' must be a list matching length of 'series'."}), 400

    # Build DataFrame with rolling values
    df = pd.DataFrame({'roll7': series}, index=pd.to_datetime(dates))

    # Feature engineering
    df['log_amt'] = np.log1p(df['roll7'])
    df['dow'] = df.index.dayofweek
    df['is_weekend'] = (df['dow'] >= 5).astype(int)

    # Scale features
    feat_vals = df[FEATURE_COLS].values
    scaled_vals = scaler.transform(feat_vals)

    # Prepare last sequence window
    last_seq = scaled_vals[-SEQ_LEN:]
    input_seq = last_seq.reshape(1, SEQ_LEN, len(FEATURE_COLS))

    # Predict next HORIZON days
    pred_scaled = model.predict(input_seq)[0, :, 0]

    # Invert scaling and log transformation
    dummy = np.zeros((HORIZON, len(FEATURE_COLS)))
    dummy[:, 0] = pred_scaled
    inv = scaler.inverse_transform(dummy)[:, 0]  # back to log_amt
    forecast = np.expm1(inv) 
    forecast=forecast.tolist()
    print(forecast)
    amount=0
    for i in range(7):
        amount+=forecast[i]
                            

    # Return JSON response
    return jsonify({
        "daywise":forecast,
        "forecast": amount,
        "horizon_days": HORIZON
    })

@app.route('/retrain', methods=['POST'])
def retrain():
    print('retraining')
    data = request.get_json()
    series = data.get('series', [])

    if not isinstance(series, list) or len(series) < 30 or len(series) > 365:
        return jsonify({'error': 'Series must be a list of 30–365 numeric values.'}), 400

    # Construct date-indexed DataFrame
    start_date = datetime.today() - timedelta(days=len(series)-1)
    dates = pd.date_range(start=start_date, periods=len(series))
    df = pd.DataFrame({
        'Date / Time': dates,
        'Debit/Credit': series
    })
    df.set_index('Date / Time', inplace=True)

    # Optional: Save raw input
    df.to_excel(FILE_PATH)

    # Optionally trigger training pipeline here (or in another thread/script)
    from forecast_pipeline import run_pipeline  # Assume you modularized it
    run_pipeline()  # This retrains and saves model, scaler, forecast

    return jsonify({'status': 'Retraining complete and model saved.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
