import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `Eres un asistente que redacta correos electrónicos para el usuario. 
Cuando el usuario diga que redactes o envíes el correo, sigue estas reglas estrictamente:

1. Responde con:
   a) El cuerpo del correo (desde el saludo hasta la firma), limpio y directo.
   b) En una línea final aparte, escribe el asunto usando exactamente este formato:
      [ASUNTO]: Aquí va el asunto.
2. No escribas encabezados como "Para", ni confirmaciones, ni explicaciones.
3. No incluyas "[ASUNTO]" dentro del cuerpo del mensaje.
4. Si no sabes el nombre del destinatario, pregunta por él antes de redactar.
5. Si no sabes el nombre del remitente (el usuario), pregunta antes de firmar, o deja el mensaje sin firma.
6. Nunca uses plantillas genéricas como "Hola [Nombre]" ni "[Tu nombre]". Escribe solo si tienes los datos reales.`
    },
    { role: 'assistant', content: 'Hola, ¿qué correo quieres redactar hoy?' }
  ]);

  const [input, setInput] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailReady, setEmailReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setGeneratedEmail('');
    setStatus('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:4000/chat', { messages: newMessages });
      const reply = res.data.reply;
      const content = reply.content;

      const subjectMatch = content.match(/\[ASUNTO\]:\s*(.+)/i);
      if (subjectMatch) {
        setEmailSubject(subjectMatch[1].trim());
      }

      const cleanBody = content.replace(/\[ASUNTO\]:\s*.+/i, '').trim();
      setGeneratedEmail(cleanBody);

      const esCorreo = cleanBody.length > 100;
      if (esCorreo) setEmailReady(true);

      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error al conectar con GPT.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const authenticate = async () => {
    window.location.href = 'http://localhost:4000/auth';
  };

  const checkAuth = async () => {
    try {
      const res = await axios.get('http://localhost:4000/emails');
      if (res.status === 200) setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const sendEmail = async () => {
    if (!emailTo || !emailSubject || !generatedEmail) return;

    setSending(true);
    try {
      await axios.post('http://localhost:4000/send-email', {
        to: emailTo,
        subject: emailSubject,
        text: generatedEmail,
      });
      setStatus('Correo enviado con éxito');
    } catch (err) {
      console.error(err);
      setStatus('Error al enviar el correo');
    }
    setSending(false);
  };

  return (
    <div style={{
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '600px',
      margin: '0 auto',
      height: '100vh',
      padding: '1rem',
      backgroundColor: '#121212',
      color: '#eee'
    }}>
      <h2 style={{ textAlign: 'center', color: '#fff' }}>EMAIL SENDER</h2>

      {!isAuthenticated && (
        <button onClick={authenticate} style={{
          background: '#ff9900',
          color: '#000',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '1rem',
          marginBottom: '1rem',
          cursor: 'pointer'
        }}>
          Conectar con Gmail
        </button>
      )}

      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '1rem',
        border: '1px solid #444',
        borderRadius: '10px',
        marginBottom: '1rem',
        background: '#1e1e1e'
      }}>
        {messages
          .filter(m => m.role !== 'system')
          .map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                maxWidth: '70%',
                background: msg.role === 'user' ? '#007aff' : '#2a2a2a',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '1rem',
                borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1rem',
                borderBottomLeftRadius: msg.role === 'user' ? '1rem' : '0.25rem',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              maxWidth: '70%',
              background: '#2a2a2a',
              color: '#aaa',
              padding: '0.75rem',
              borderRadius: '1rem',
              borderBottomLeftRadius: '0.25rem',
              fontStyle: 'italic'
            }}>
              GPT está escribiendo...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '1rem',
            border: '1px solid #333',
            background: '#222',
            color: '#fff'
          }}
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} style={{
          background: '#007aff',
          color: '#fff',
          padding: '0.75rem 1rem',
          border: 'none',
          borderRadius: '1rem',
          cursor: 'pointer'
        }}>Enviar</button>
      </div>

      {emailReady && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#1e2a1f',
          border: '1px solid #3a5f3e',
          borderRadius: '10px'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Correo generado:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#161616', padding: '0.75rem', borderRadius: '0.5rem', color: '#e1e1e1' }}>
            {generatedEmail}
          </pre>

          <input
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #444',
              background: '#222',
              color: '#fff'
            }}
            placeholder="Correo del destinatario"
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
          />
          <input
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #444',
              background: '#222',
              color: '#fff'
            }}
            placeholder="Asunto"
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
          />
          <button onClick={sendEmail} disabled={sending || !isAuthenticated} style={{
            marginTop: '0.75rem',
            padding: '0.5rem 1rem',
            background: sending ? '#444' : '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}>
            {sending ? 'Enviando...' : 'Enviar correo'}
          </button>
          <p style={{ color: '#9f9' }}>{status}</p>
        </div>
      )}
    </div>
  );
}

export default App;
