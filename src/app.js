require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(bodyParser.json());


app.use('/api', chatRoutes);
// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "RAG backend is running 🚀" });
});


app.use(errorHandler);

module.exports = app;
