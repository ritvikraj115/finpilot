````markdown
# FinPilot

FinPilot is a modern, AI-powered personal finance dashboard that helps you plan, track, and optimize your spending. With real-time charts, automated forecasting, intelligent budgeting advice, and auto‑categorization, FinPilot empowers you to take control of your money.

---

## 🚀 Key Features

- **Expense Tracking**  
  Log your transactions (debits/credits) by category and date. View daily, weekly, and monthly summaries.

- **Budget Management**  
  Define monthly spending limits per category (Food, Education, Apparel, Transportation, Household, Miscellaneous). See at-a-glance how much you’ve spent vs. your limits.

- **Interactive Dashboards & Charts**  
  - **Bar Chart**: Compare actual spend vs. set limit for each category.  
  - **Line Chart**: Visualize your next seven predicted transaction amounts.  
  - **Histogram**: Distribution of upcoming expense counts.  
  - **Doughnut (optional)**: Overall budget utilization percentage.  

- **Alerts & Risk Indicators**  
  Automatically detect the category with the highest “spent-to-limit” ratio and flag it as **At-Risk** if you’re close to (or over) budget.

- **Transaction Analytics**  
  - Count and average your daily transactions over the past 30 days.  
  - Drill down on spikes, weekends vs. weekdays, and day-of-week patterns.

- **Auto‑Settle Future Expenses**  
  When you add a new transaction, FinPilot checks any planned “future expenses” you’ve entered for that month. If the transaction matches (by category & approximate amount) a future expense, it’s automatically marked as “settled,” keeping your plan and actuals in sync.

---

## 🤖 AI & ML Features

### 1. **AI Budgeting Advisor**  
- Powered by Google Gemini via `@google/genai`.  
- Provides **3–4 actionable**, personalized insights based on your:
  - Historical budgets & spend  
  - Last 3 months of actual spending  
  - Your upcoming budget plan  

### 2. **Time‑Series Forecasting**  
- A sequence‑to‑sequence LSTM predicts your **next 7** transaction amounts:  
  1. Log-transform and scale your last 30 days of daily totals.  
  2. Feed into an LSTM (TensorFlow/Keras) and forecast 7 future points.  
  3. Invert the transformations to get real-world amounts.  
- Automatically retrainable via the `/retrain` endpoint.

### 3. **Category Prediction**  
- Uses **Logistic Regression** with **Grid Search** to automatically classify each transaction into one of your budget categories (Food, Education, Apparel, etc.).  
- Trained on historical labeled transactions; hyperparameters tuned via scikit‑learn’s `GridSearchCV`.  
- Keeps your expense chart up‑to‑date without manual tagging.

### 4. **Transaction Rate Analytics**  
- Aggregates the count of transactions per day for the past 30 days.  
- Computes **average transactions per day** to help you understand your spending frequency.

---

## 🏗️ Architecture & Tech Stack

| Layer                | Technology                                   |
|----------------------|----------------------------------------------|
| **Frontend**         | React, Styled‑Components, react‑chartjs‑2     |
| **Backend**          | Node.js, Express                             |
| **AI SDK**           | `@google/genai` (Gemini)                     |
| **Forecast Service** | Python (Flask), TensorFlow/Keras, scikit‑learn scaler |
| **Database**         | MongoDB with Mongoose                        |
| **Authentication**   | JWT / Passport.js (or similar)               |

---

## 📦 Getting Started

1. **Clone the repo**  
   ```bash
   git clone git@github.com:your-org/finpilot.git
   cd finpilot
````

2. **Setup Backend**

   ```bash
   cd server
   npm install
   # create a .env file with:
   #   MONGODB_URI=<your-mongo-uri>
   #   JWT_SECRET=<your-jwt-secret>
   #   GOOGLE_API_KEY=<your-google-genai-key>
   npm start
   ```

3. **Setup Forecast Service**

   ```bash
   cd server/ml_models/forecast_service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python run_forecast.py  # ensure model & scaler exist
   flask run --port 8000
   ```

4. **Setup Frontend**

   ```bash
   cd client
   npm install
   npm start
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

---

## 📜 API Reference

### POST `/insights/getinsights`

* **Request Body**

  ```json
  {
    "message": "Any specific question",
    "planner": {
      "month": "YYYY-MM",
      "budget": 50000,
      "futureExpenses": { "Food": 2000, ... }
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
  { "series": [ /* per-transaction amounts */ ] }
  ```
* **Response**

  ```json
  {
    "daywise": [ /* 7 predicted amounts */ ],
    "forecast": 1234.56,
    "horizon_days": 7,
    "txnHistory": {
      "dates": [ "YYYY-MM-DD", ... ],
      "counts": [ 5, 2, 0, ... ],
      "averagePerDay": 1.8
    }
  }
  ```

### POST `/retrain`

* **Request Body**

  ```json
  { "series": [ /* 30–365 daily totals */ ] }
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
4. Push to your branch and open a Pull Request


