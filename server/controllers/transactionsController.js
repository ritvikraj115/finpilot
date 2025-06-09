// server/controllers/transactionsController.js
const axios = require('axios');
const Transaction = require('../models/Transaction');
const Planner = require('../models/Planner');
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: 'AIzaSyD3nh3x80zD_z4mPMD0X1rgtalOGPJN7SM' });

exports.createTransaction = async (req, res, next) => {
  try {
    const { description, amount } = req.body;
    const userId = req.user.id;

    //1) Create the transaction (category stubbed here)
    const mlRes = await axios.post(`${process.env.MLSERVICE_URL}/predict`, { description });
    const category = mlRes.data.category;
    const txn = await Transaction.create({ userId, description, amount, category });

    // 2) Compute planner month key
    const txnDate = txn.date || new Date();
    const monthKey = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;

    // 3) Load the planner for that month
    const planner = await Planner.findOne({ userId, month: monthKey });
    if (planner && planner.futureExpenses.length > 0) {
      // 4) Build Gemini prompt listing planned descriptions
      const plannedList = planner.futureExpenses.map(fe => fe.description);
      const prompt = `
You are an expense-matching assistant.
User's planned expenses: ${JSON.stringify(plannedList)}.
New transaction description: "${description}".
Respond with a JSON array of exactly those planned descriptions
that this transaction fulfills. If none match, respond with [].
      `.trim();

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      })

      // 6) Parse matches
      let matches = [];
      try {
        const content = geminiResponse.candidates[0].content.parts[0].text
          || geminiResponse.data?.choices?.[0]?.message?.content
          || '[]';
        console.log(content)
        matches = JSON.parse(content);
        console.log(typeof(matches))
      } catch (parseErr) {
        console.warn('Could not parse Gemini response:', parseErr);
      }

      // 7) Remove matched future expenses
      if (Array.isArray(matches) && matches.length > 0) {
        planner.futureExpenses = planner.futureExpenses.filter(
          fe => !matches.includes(fe.description)
        );
        await planner.save();
      }
    }

    // 8) Return the created transaction
    res.status(201).json(txn);
  } catch (err) {
    console.error('createTransaction error:', err.response?.data || err.message);
    next(err);
  }
};

exports.listTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const txns = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(txns);
  } catch (err) {
    next(err);
  }
};

exports.getRecentTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id; // populated by your requireAuth middleware

    // Find the 5 most recent transactions for this user
    const recent = await Transaction.find({ userId })
      .sort({ date: -1 })    // latest first
      .limit(5);

    return res.json(recent);
  } catch (err) {
    console.error("Error in getRecentTransactions:", err);
    next(err);
  }
};


