//////////////////////CONFIGURAÇÃO INICIAL///////////////////////////

const express = require('express');
const session = require('express-session'); //PERMITE AO SERVIDOR LEMBRAR QUEM É O USUÁRIO LOGADO E O QUE ELE COLOCOU NO CARRINHO
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({
    secret: 'chave-secreta-eshop',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public'))); 

////////////////////////BANCO DE DADOS TEMPORÁRIO/////////////////

//LISTA DE OBJETOS QUE SIMULA UM BANCO DE DADOS
let produtos = [
    { id: 1, nome: "Notebook Gamer", preco: 4500, estoque: 8, categoria: "Eletrônicos", avaliacoes: [5, 5, 4], desc: "RTX 3060, 16GB RAM" },
    { id: 2, nome: "Mouse Wireless", preco: 150, estoque: 20, categoria: "Acessórios", avaliacoes: [4, 3], desc: "Sensor óptico 1600dpi" },
    { id: 3, nome: "Luminária LED", preco: 80, estoque: 15, categoria: "Casa", avaliacoes: [5], desc: "Luz branca fria" } 
];

//LISTA COM O USUÁRIO ÚNICO
const USERS = [{ user: "admin", pass: "123" }];

////////////////////////ROTAS DE PRODUTOS (CRUD)/////////////

//DEVOLVE A LISTA COMPLETA DE PRODUTOS AO FRONTEND
app.get('/api/produtos', (req, res) => {
    res.json(produtos);
});

//SE RECEBER UM id ELE ATUALIZA O PRODUTO EXISTENTE E SE NÃO RECEBER ELE CRIA UM NOVO PRODUTO 
app.post('/api/produtos', (req, res) => {
    const { id, nome, preco, estoque, categoria, desc } = req.body;
    
    if (id) { 
        const idx = produtos.findIndex(p => p.id == id);
        if (idx !== -1) {
            produtos[idx] = { ...produtos[idx], nome, preco: parseFloat(preco), estoque: parseInt(estoque), categoria, desc };
            return res.json(produtos[idx]);
        }
    } else { 
        const novo = { id: Date.now(), nome, preco: parseFloat(preco), estoque: parseInt(estoque), categoria, desc, avaliacoes: [5] };
        produtos.push(novo);
        return res.status(201).json(novo);
    }
});

//DELETA O PRODUTO CORRESPONDENTE AO id ENVIADO
app.delete('/api/produtos/:id', (req, res) => {
    produtos = produtos.filter(p => p.id != req.params.id);
    res.status(204).send();
});

//ENCONTRA O PRODUTO E ADICIONA UMA NOVA NOTA DE AVALIAÇÃO
app.post('/api/produtos/:id/avaliar', (req, res) => {
    const p = produtos.find(x => x.id == req.params.id);
    if (p) {
        p.avaliacoes.push(parseInt(req.body.nota));
        return res.json(p);
    }
    res.status(404).json({ erro: "Produto não encontrado" });
});

////////////////////////ROTAS DE AUTENTICAÇÃO//////////////////////////////////////////

//VALIDA SE O USUÁRIO E A SENHA BATEM COM A LISTA users, E SE ESTIVER CERTO SALVA O NOME DE USUÁRIO
app.post('/api/auth/login', (req, res) => {
    const { u, p } = req.body;
    const userValid = USERS.find(x => x.user === u && x.pass === p);
    if (userValid) {
        req.session.user = u;
        return res.json({ sucesso: true, user: u });
    }
    res.status(401).json({ sucesso: false });
});

//DESLOGA O USUÁRIO E LIMPA SEUS DADOS TEMPORÁRIOS
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ sucesso: true });
});

app.get('/api/auth/check', (req, res) => {
    res.json({ user: req.session.user || null });
});

////////////////////ROTAS DO CARRINHO DE COMPRAS///////////////////////

//RETORNA OS ITENS SALVOS NO CARRINHO DO USUÁRIO ATUAL
app.get('/api/carrinho', (req, res) => {
    req.session.carrinho = req.session.carrinho || [];
    res.json(req.session.carrinho);
});

//VERIFICA SE O PRODUTO EXISTE E SE TEM ESTOQUE DISPONÍVEL, SE O PRODUTO JÁ ESTIVER NO CARRINHO ELE
// AUMENTA A QUANTIDADE, CASO CONTRÁRIO ADICIONA UM NOVO ITEM
app.post('/api/carrinho/adicionar', (req, res) => {
    req.session.carrinho = req.session.carrinho || [];
    const prodId = req.body.id;
    const p = produtos.find(x => x.id == prodId);
    
    if (!p || p.estoque <= 0) return res.status(400).json({ erro: "Sem stock" });

    const item = req.session.carrinho.find(x => x.id == prodId);
    if (item) {
        item.qtd++;
    } else {
        req.session.carrinho.push({ id: p.id, nome: p.nome, preco: p.preco, qtd: 1 });
    }
    res.json(req.session.carrinho);
});

//LOCALIZA O PRODUTO ORIGINAL NA LISTA GLOBAL E TIRA A QUANTIDADE COMPRADA DO ESTOQUE REAL, E ESVAZIA O CARRINHO NO FINAL DA SESSÃO
app.post('/api/carrinho/finalizar', (req, res) => {
    const cart = req.session.carrinho || [];
    if (cart.length === 0) return res.status(400).json({ erro: "Carrinho vazio" });


    for (const item of cart) {
        const prodReal = produtos.find(p => p.id == item.id);
        if (prodReal) prodReal.estoque -= item.qtd;
    }

    req.session.carrinho = []; 
    res.json({ sucesso: true });
});

app.listen(PORT, () => console.log(`Servidor a rodar em http://localhost:${PORT}`));