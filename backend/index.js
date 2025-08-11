const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI config (versión 4.x)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Nodemailer config (usando Gmail con contraseña de aplicación)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Endpoint para conversar con GPT
app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    const reply = completion.choices[0].message;
    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Error con OpenAI' });
  }
});

// Endpoint para enviar el correo
app.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend listo en http://localhost:${PORT}`);
});
