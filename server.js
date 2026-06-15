import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
// PASSO 1: Alterar a porta padrão para 4000
const PORT = process.env.PORT || 4000;

app.use(express.json());

// PASSO 2, 3 e 4: Ajustar o mock de dados (Removido order-102, alterado status e contexto para suporte)
let chats = [
  {
    id: "order-101",
    orderStatus: "Em andamento",
    // Substituído driver por agent + adicionado campo id nos participantes
    agent: { id: "user_agent_1", name: "Carlos Silva", phone: "(11) 99999-8888" },
    customer: { id: "user_client_1", name: "Ana Souza" },
    messages: [
      { id: 1, sender: "system", text: "Atendimento iniciado pelo suporte.", timestamp: "15:30" },
      { id: 2, sender: "agent", text: "Olá Ana, tudo bem? Como posso te ajudar com o seu pedido hoje?", timestamp: "15:31" },
      { id: 3, sender: "customer", text: "Oi Carlos! Meu aplicativo está dando erro na tela de pagamento.", timestamp: "15:32" }
    ]
  }
];

// --- ROTAS DA API ---

// PASSO 5: Rota GET /api/chats (Listar todos) REMOVIDA.

// 1. Buscar os detalhes de um chat específico pelo ID do pedido
app.get('/api/chats/:orderId', (req, res) => {
  const chat = chats.find(c => c.id === req.params.orderId);
  if (!chat) {
    return res.status(404).json({ error: "Atendimento não encontrado." });
  }
  res.json(chat);
});

// 2. Enviar uma nova mensagem em um chat
app.post('/api/chats/:orderId/messages', (req, res) => {
  const { orderId } = req.params;
  const { sender, text } = req.body;

  if (!sender || !text) {
    return res.status(400).json({ error: "Os campos 'sender' e 'text' são obrigatórios." });
  }

  const chat = chats.find(c => c.id === orderId);
  if (!chat) {
    return res.status(404).json({ error: "Chat não encontrado." });
  }

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newMessage = {
    id: chat.messages.length + 1,
    sender,
    text,
    timestamp
  };

  chat.messages.push(newMessage);
  res.status(201).json(newMessage);
});

// --- SERVIR INTERFACE FRONT-END ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Servidor de Suporte rodando em: http://localhost:${PORT}`);
});