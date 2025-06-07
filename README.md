# FinPilot

FinPilot is a modern, AI-powered personal finance dashboard that helps you plan, track, and optimize your spending. With real-time charts, automated forecasting, and intelligent budgeting advice, FinPilot empowers you to take control of your money.

---

## 🚀 Key Features

* **Expense Tracking**
  Log your transactions (debits/credits) by category and date. View daily, weekly, and monthly summaries.

* **Budget Management**
  Define monthly spending limits per category (Food, Education, Apparel, Transportation, Household, Miscellaneous). See at-a-glance how much you’ve spent vs. your limits.

* **Interactive Dashboards & Charts**

  * **Bar Chart**: Compare actual spend vs. set limit for each category.
  * **Line Chart**: Visualize your next seven predicted transaction amounts.
  * **Histogram**: Distribution of upcoming expense counts.
  * **Doughnut (optional)**: Overall budget utilization percentage.

* **Alerts & Risk Indicators**
  Automatically detect the category with the highest “spent-to-limit” ratio and flag it as **At-Risk** if you’re close to (or over) budget.

* **Transaction Analytics**

  * Count and average your daily transactions over the past 30 days.
  * Drill down on spikes, weekends vs. weekdays, and day-of-week patterns.

* **REST API Backend**

  * **/insights/getinsights**: Fetch 3–4 personalized, “life-saving” budgeting insights.
  * **/forecast**: Return the next 7 transaction forecasts (and a 30-day transaction average).
  * **/retrain**: Retrain the LSTM model on new data.

---

## 🤖 AI & ML Features

### 1. **AI Budgeting Advisor**

* Powered by Google Gemini via `@google/genai`.
* Provides **3–4 actionable**, personalized insights (in JSON) based on your:

  * Historical budgets & spend
  * Last 3 months of actual spending
  * Your upcoming budget plan

### 2. **Time-Series Forecasting**

* A sequence-to-sequence LSTM predicts your **next 7** transaction amounts:

  1. Log-transform and scale your last 30 days of daily totals.
  2. Feed into an LSTM (TensorFlow/Keras) and forecast 7 future points.
  3. Invert the transformations to get real-world amounts.
* Automatically retrainable via the `/retrain` endpoint.

### 3. **Transaction Rate Analytics**

* Aggregates the count of transactions per day for the past 30 days.
* Computes **average transactions per day** to help you understand your spending frequency.

---

## 🏗️ Architecture & Tech Stack

| Layer                | Technology                                                 |
| -------------------- | ---------------------------------------------------------- |
| **Frontend**         | React, Styled-Components, react-chartjs-2                  |
| **Backend**          | Node.js, Express                                           |
| **AI SDK**           | `@google/genai` (Gemini)                                   |
| **Forecast Service** | Python (Flask), TensorFlow/Keras, scikit-learn scaler      |
| **Database**         | MongoDB with Mongoose                                      |
| **Authentication**   | JWT / Passport.js (or similar)                             |
| **CI/CD & MLOps**    | Docker, Kubernetes / Serverless, GitHub Actions (optional) |

---

## 📦 Getting Started

1. **Clone the repo**

   ```bash
   git clone git@github.com:your-org/finpilot.git
   cd finpilot
   ```

2. **Setup Backend**

   ```bash
   cd server
   npm install
   # create a .env with MONGODB_URI, JWT_SECRET, GOOGLE_API_KEY, etc.
   npm run start
   ```

3. **Setup Forecast Service**

   ```bash
   cd server/ml_models/forecast_service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python run_forecast.py  # ensures model & scaler exist
   flask run --port 8000
   ```

4. **Setup Frontend**

   ```bash
   cd client
   npm install
   npm start
   ```

5. **Open in browser**: `http://localhost:3000`

---

## 🔄 Retraining & Model Updates

* Send a POST to `/retrain` with JSON:

  ```json
  { "series": [/* 30–365 daily values */] }
  ```
* The pipeline will re-scale, re-sequence, retrain the LSTM, and save a new model + scaler.

---

## 📜 API Reference

### POST `/insights/getinsights`

* **Request Body**

  ```json
  {
    "message": "Any specific question",
    "planner": {
      "month": "2025-06",
      "budget": 50000,
      "futureExpenses": { /* category→amount map */ }
    }
  }
  ```
* **Response**

  ```json
  {
    "insights": [
      "Insight #1…",
      "Insight #2…",
      "Insight #3…"
    ]
  }
  ```

### POST `/forecast`

* **Request Body**

  ```json
  { "series": [/* per-transaction amounts */] }
  ```
* **Response**

  ```json
  {
    "daywise": [/* 7 predicted amounts */],
    "forecast": /* sum of next 7 */,
    "horizon_days": 7,
    "txnHistory": {
      "dates": [/* last 30 days */],
      "counts": [/* txn counts */],
      "averagePerDay": /* avg over 30 days */
    }
  }
  ```

### POST `/retrain`

* **Request Body**

  ```json
  { "series": [/* 30–365 daily totals */] }
  ```
* **Response**

  ```json
  { "status": "Retraining complete and model saved." }
  ```

---

## 🙌 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -m "feat: add foo"`)
4. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
