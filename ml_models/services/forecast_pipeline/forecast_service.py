# forecast_service.py
# Flask service for sequence-to-sequence LSTM forecasting
# Includes a background keep-alive job that runs every 10 minutes.

import os
import atexit
import threading
import time
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, current_app, make_response
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib

# If you use Keras/TensorFlow model
try:
    from tensorflow.keras.models import load_model
except Exception:
    load_model = None

from config import FILE_PATH, CATEGORY_MODEL_PATH, MODEL_PATH, SCALER_PATH

# ---------------------------
# App & config
# ---------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

SEQ_LEN = 30
HORIZON = 7
FEATURE_COLS = ['log_amt', 'dow', 'is_weekend']

# ---------------------------
# Load model & scaler (best-effort)
# ---------------------------
_model = None
_scaler = None

if load_model and MODEL_PATH and os.path.exists(MODEL_PATH):
    try:
        _model = load_model(MODEL_PATH)
        print(f"[startup] Loaded LSTM model from {MODEL_PATH}")
    except Exception as e:
        print(f"[startup] Warning: failed to load model from {MODEL_PATH}: {e}")
else:
    print(f"[startup] Model not loaded: load_model available={bool(load_model)} PATH={MODEL_PATH}")

if SCALER_PATH and os.path.exists(SCALER_PATH):
    try:
        _scaler = joblib.load(SCALER_PATH)
        print(f"[startup] Loaded scaler from {SCALER_PATH}")
    except Exception as e:
        print(f"[startup] Warning: failed to load scaler from {SCALER_PATH}: {e}")
else:
    print(f"[startup] Scaler not loaded: SCALER_PATH={SCALER_PATH}")

# ---------------------------
# Keep-alive endpoint
# ---------------------------
@app.route('/keep-alive', methods=['GET'])
def keep_alive():
    return jsonify({"status": "alive"}), 200

# ---------------------------
# Predict (category) endpoint
# ---------------------------
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
    # compute relative model path (example)
    MODEL_P = os.path.join(current_app.root_path, '..', 'models', 'expense_category_model.pkl')
    MODEL_P = os.path.normpath(MODEL_P)

    print("Working directory:", os.getcwd())
    print("app.root_path   :", current_app.root_path)
    print("Looking for file at:", MODEL_P)
    print("Exists? ", os.path.exists(MODEL_P))
    if not os.path.exists(MODEL_P):
        try:
            files_here = os.listdir(os.path.dirname(MODEL_P))
            print("Files in that folder:", files_here)
        except Exception:
            pass

    try:
        clf = joblib.load(MODEL_P)
    except Exception as e:
        print(f"[predict] Failed to load classifier at {MODEL_P}: {e}")
        return jsonify({'error': 'Category model not available'}), 500

    data = request.get_json() or {}
    description = data.get('description', '')
    if not description:
        return jsonify({'error': 'Description is required'}), 400

    try:
        pred = clf.predict([description])
        category = pred[0]
    except Exception as e:
        print(f"[predict] prediction failed: {e}")
        return jsonify({'error': 'Prediction failed'}), 500

    resp = make_response(jsonify({'category': category}))
    resp.headers["Access-Control-Allow-Origin"]      = "https://finpilot-pi.vercel.app"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    return resp

# ---------------------------
# Forecast endpoint
# ---------------------------
@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.get_json(force=True)
    series = data.get('series')
    dates = data.get('dates', None)

    if not isinstance(series, list) or len(series) < SEQ_LEN:
        return jsonify({"error": f"'series' must be a list of at least {SEQ_LEN} values."}), 400

    if dates is None:
        end = pd.Timestamp.today().normalize()
        start = end - pd.Timedelta(days=len(series)-1)
        dates = pd.date_range(start, periods=len(series), freq='D').strftime('%Y-%m-%d').tolist()
    else:
        if not isinstance(dates, list) or len(dates) != len(series):
            return jsonify({"error": "If provided, 'dates' must be a list matching length of 'series'."}), 400

    df = pd.DataFrame({'roll7': series}, index=pd.to_datetime(dates))
    df['log_amt'] = np.log1p(df['roll7'])
    df['dow'] = df.index.dayofweek
    df['is_weekend'] = (df['dow'] >= 5).astype(int)

    if _scaler is None:
        return jsonify({"error": "Scaler not loaded on server."}), 500
    feat_vals = df[FEATURE_COLS].values
    scaled_vals = _scaler.transform(feat_vals)

    last_seq = scaled_vals[-SEQ_LEN:]
    input_seq = last_seq.reshape(1, SEQ_LEN, len(FEATURE_COLS))

    if _model is None:
        return jsonify({"error": "Forecast model not loaded on server."}), 500
    pred_scaled = _model.predict(input_seq)[0, :, 0]

    dummy = np.zeros((HORIZON, len(FEATURE_COLS)))
    dummy[:, 0] = pred_scaled
    inv = _scaler.inverse_transform(dummy)[:, 0]
    forecast_vals = np.expm1(inv)
    forecast_list = forecast_vals.tolist()
    print("forecast:", forecast_list)

    amount = sum(forecast_list[:HORIZON])

    return jsonify({
        "daywise": forecast_list,
        "forecast": amount,
        "horizon_days": HORIZON
    })

# ---------------------------
# Retrain endpoint
# ---------------------------
@app.route('/retrain', methods=['POST'])
def retrain():
    print('retraining')
    data = request.get_json() or {}
    series = data.get('series', [])

    if not isinstance(series, list) or len(series) < 30 or len(series) > 365:
        return jsonify({'error': 'Series must be a list of 30–365 numeric values.'}), 400

    start_date = datetime.today() - timedelta(days=len(series)-1)
    dates = pd.date_range(start=start_date, periods=len(series))
    df = pd.DataFrame({
        'Date / Time': dates,
        'Debit/Credit': series
    })
    df.set_index('Date / Time', inplace=True)

    try:
        df.to_excel(FILE_PATH)
    except Exception as e:
        print(f"[retrain] could not save input to {FILE_PATH}: {e}")

    try:
        from forecast_pipeline import run_pipeline
        run_pipeline()
    except Exception as e:
        print(f"[retrain] run_pipeline failed: {e}")
        return jsonify({'error': 'Retrain failed'}), 500

    return jsonify({'status': 'Retraining complete and model saved.'})

# ---------------------------
# Keep-alive / scheduler
# ---------------------------
SELF_PING_URL = os.environ.get('SELF_PING_URL', 'http://localhost:8000/keep-alive')
KEEP_ALIVE_MINUTES = int(os.environ.get('KEEP_ALIVE_MINUTES', '10'))

def _ping_once():
    now = datetime.utcnow().isoformat()
    # use requests if available
    try:
        import requests  # type: ignore
        try:
            r = requests.get(SELF_PING_URL, timeout=10)
            print(f"[keep-alive] {now} {SELF_PING_URL} -> {r.status_code}")
        except Exception as e:
            print(f"[keep-alive] {now} requests error pinging {SELF_PING_URL}: {e}")
    except Exception:
        # fallback to urllib
        try:
            from urllib.request import urlopen, Request
            req = Request(SELF_PING_URL, method='GET', headers={'User-Agent': 'keep-alive/1.0'})
            with urlopen(req, timeout=10) as r:
                status = getattr(r, 'status', None) or (r.getcode() if hasattr(r, 'getcode') else None)
                print(f"[keep-alive] {now} {SELF_PING_URL} -> {status}")
        except Exception as e:
            print(f"[keep-alive] {now} urllib error pinging {SELF_PING_URL}: {e}")

# Try to use APScheduler if available; else fallback to a simple daemon thread.
_scheduler = None
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(_ping_once, 'interval', minutes=KEEP_ALIVE_MINUTES, next_run_time=datetime.utcnow())
    _scheduler.start()
    print(f"[keep-alive] APScheduler started: pinging {SELF_PING_URL} every {KEEP_ALIVE_MINUTES} minutes")
except Exception:
    # fallback thread
    def _ping_loop(stop_event):
        print(f"[keep-alive] fallback thread started: pinging {SELF_PING_URL} every {KEEP_ALIVE_MINUTES} minutes")
        while not stop_event.wait(KEEP_ALIVE_MINUTES * 60):
            _ping_once()

    _stop_event = threading.Event()
    t = threading.Thread(target=_ping_loop, args=(_stop_event,), daemon=True, name="keep-alive-thread")
    t.start()

# Ensure cleanup on exit
def _shutdown():
    try:
        if _scheduler:
            _scheduler.shutdown(wait=False)
            print("[keep-alive] APScheduler shutdown")
    except Exception:
        pass
    try:
        if '_stop_event' in globals():
            _stop_event.set()
            print("[keep-alive] fallback thread stop signalled")
    except Exception:
        pass

atexit.register(_shutdown)

# ---------------------------
# Run app
# ---------------------------
if __name__ == '__main__':
    # Note: when running with gunicorn/uwsgi you probably won't use app.run
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)


