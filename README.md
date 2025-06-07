# FinPilot

FinPilot is a modern, AI-powered personal finance dashboard that helps you plan, track, and optimize your spending. With real-time charts, automated forecasting, intelligent budgeting advice, auto‑categorization, and seamless integrations, FinPilot empowers you to take control of your money.

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
  Automatically detect the category with the highest “spent-to-limit” ratio and flag it as **At‑Risk** if you’re close to (or over) budget.

- **Transaction Analytics**  
  - Count and average your daily transactions over the past 30 days.  
  - Drill down on spikes, weekends vs. weekdays, and day‑of‑week patterns.

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



