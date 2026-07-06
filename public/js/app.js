var app = {
    async render() {
        try {
          
            const response = await fetch('/api/produtos');
            if (!response.ok) throw new Error('Servidor offline');
            let prods = await response.json();

            const busca = document.getElementById('buscaProd').value.toLowerCase();
            const cat = document.getElementById('filtroCat').value;
            const ordem = document.getElementById('filtroOrdem').value;

            prods = prods.filter(p => p.nome.toLowerCase().includes(busca) && (cat === "" || p.categoria === cat));
            prods.sort((a, b) => ordem === 'asc' ? a.preco - b.preco : b.preco - a.preco);

            const container = document.getElementById('listaProdutos');
            
           
            container.innerHTML = prods.map(p => {
                const totalNotas = p.avaliacoes.reduce((a, b) => a + b, 0);
                const media = p.avaliacoes.length > 0 ? Math.round(totalNotas / p.avaliacoes.length) : 0;

                return `
                <div class="col-md-4 col-lg-3">
                    <div class="card h-100 card-prod shadow-sm">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">${p.categoria}</small>
                                <small class="${p.estoque <= 3 ? 'text-danger fw-bold' : 'text-secondary'}">Estoque: ${p.estoque}</small>
                            </div>
                            <h6 class="fw-bold my-1">${p.nome}</h6>
                            <div class="star mb-2" onclick="app.prepararAvaliacao(${p.id})" data-bs-toggle="modal" data-bs-target="#modalAvaliar" title="Clique para avaliar">
                                ${'★'.repeat(media)}${'☆'.repeat(5 - media)} 
                                <small class="text-muted">(${p.avaliacoes.length})</small>
                            </div>
                            <p class="text-success fw-bold flex-grow-1">R$ ${p.preco.toFixed(2)}</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-sm btn-dark" onclick="app.addCarrinho(${p.id})">Comprar</button>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="app.editarProduto(${p.id})" data-bs-toggle="modal" data-bs-target="#modalGerenciar">✏️</button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="app.excluirProduto(${p.id})">🗑️</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');

            this.updateCartCount();
        } catch (error) {
            console.error("Erro no render:", error);
            document.getElementById('listaProdutos').innerHTML = `<div class="col-12"><div class="alert alert-danger">Erro: Não foi possível carregar os dados. Verifique se o servidor (node server.js) está rodando.</div></div>`;
        }
    },

    //ENVIA O PRODUTO SELECIONADO PARA O CARRINHO NO SERVIDOR E SE NÃO TIVER ESTOQUE AVISA AO USUÁRIO
    async addCarrinho(id) {
        const response = await fetch('/api/carrinho/adicionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if(response.ok) {
            alert("✅ Produto adicionado ao carrinho!");
            this.updateCartCount();
        } else {
            alert("⚠️ Produto esgotado!");
        }
    },

    //ATUALIZA O NÚMERO DE ITENS QUE APARECE NO ÍCONE DO CARRINHO
    async updateCartCount() {
        try {
            const resCart = await fetch('/api/carrinho');
            const cart = await resCart.json();
            const totalItens = cart.reduce((acc, item) => acc + item.qtd, 0);
            document.getElementById('cart-count').innerText = totalItens;
        } catch (e) {}
    },

    //MOSTRA A LISTA DE ITENS ADICIONADOS E CALCULA O VALOR TOTAL DA COMPRA
    async abrirCarrinho() {
        const response = await fetch('/api/carrinho');
        const cart = await response.json();
        
       
        const list = document.getElementById('cart-items-list'); 
        
        if (cart.length === 0) { 
            list.innerHTML = "<p class='text-center'>Carrinho vazio</p>"; 
            return; 
        }

        let total = 0;
        list.innerHTML = cart.map(item => {
            total += item.preco * item.qtd;
            return `<div class="d-flex justify-content-between border-bottom py-1"><span>${item.nome} (${item.qtd}x)</span><b>R$ ${(item.preco * item.qtd).toFixed(2)}</b></div>`;
        }).join('') + `<div class="text-end fw-bold mt-2 fs-5">Total: R$ ${total.toFixed(2)}</div>`;
    },

    //VERIFICA SE O USUÁRIO ESTÁ LOGADO E SE ESTIVER FECHA A COMPRA E ATUALIZA
    async finalizarPedido() { 
        const authCheck = await fetch('/api/auth/check');
        const authData = await authCheck.json();
        
        if (!authData.user) {
            alert("⚠️ Bloqueado: Faça login para finalizar sua compra!");
            bootstrap.Modal.getInstance(document.getElementById('modalCarrinho')).hide();
            auth.toggleLoginForm();
            return;
        }

        const response = await fetch('/api/carrinho/finalizar', { method: 'POST' });
        if (response.ok) {
            alert("🎉 Compra finalizada! O estoque foi atualizado.");
            bootstrap.Modal.getInstance(document.getElementById('modalCarrinho')).hide();
            this.render();
        } else {
            alert("Erro ao finalizar a compra. O seu carrinho pode estar vazio.");
        }
    },

    //ABREM A JANELA PARA O USUÁRIO DAR UMA AVALIAÇÃO 
    prepararAvaliacao(id) { 
        document.getElementById('avaliarProdId').value = id;
    },

    async salvarAvaliacao() {
        const id = document.getElementById('avaliarProdId').value;
        const nota = document.getElementById('notaEstrela').value;

        await fetch(`/api/produtos/${id}/avaliar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota })
        });

        alert("⭐ Obrigado pela avaliação!");
        bootstrap.Modal.getInstance(document.getElementById('modalAvaliar')).hide();
        this.render();
    },

    //SALVA O PRODUTO 
    async salvarProduto() {
        const id = document.getElementById('prodId').value;
        const payload = {
            id: id ? parseInt(id) : null,
            nome: document.getElementById('prodNome').value,
            preco: document.getElementById('prodPreco').value,
            estoque: document.getElementById('prodEstoque').value,
            categoria: document.getElementById('prodCat').value, 
            desc: document.getElementById('prodDesc').value
        };

        await fetch('/api/produtos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        bootstrap.Modal.getInstance(document.getElementById('modalGerenciar')).hide();
        this.limparForm();
        this.render();
    },

    //EDITA O PRODUTO
    async editarProduto(id) {
        const response = await fetch('/api/produtos');
        const prods = await response.json();
        const p = prods.find(x => x.id == id);

        document.getElementById('prodId').value = p.id;
        document.getElementById('prodNome').value = p.nome;
        document.getElementById('prodPreco').value = p.preco;
        document.getElementById('prodEstoque').value = p.estoque;
        document.getElementById('prodCat').value = p.categoria; 
        document.getElementById('prodDesc').value = p.desc;
        document.getElementById('tituloModal').innerText = "Editar Produto";
    },

    //EXCLUI O PRODUTO
    async excluirProduto(id) {
        if (confirm("Excluir este produto?")) {
            await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
            this.render();
        }
    },

    limparForm() {
        document.getElementById('prodId').value = "";
        document.querySelectorAll('#modalGerenciar input, #modalGerenciar textarea').forEach(i => i.value = "");
        document.getElementById('tituloModal').innerText = "Novo Produto";
    }
};

const bot = {
    //LÊ O QUE O USUÁRIO DIGITOU NO CHAT
    pergunta() {
        const i = document.getElementById('chat-input');
        const b = document.getElementById('chat-body');
        const m = i.value.toLowerCase();
        let r = "Tente 'entrega', 'pagamento' ou 'admin'.";
        if (m.includes("entrega")) r = "Entregamos em até 5 dias.";
        if (m.includes("pagamento")) r = "Aceitamos Pix e Cartão.";
        if (m.includes("admin")) r = "User: admin | Pass: 123";

        b.innerHTML += `<div class='text-end'><b>Você:</b> ${i.value}</div>`;
        b.innerHTML += `<div class='text-primary'><b>Bot:</b> ${r}</div>`;
        i.value = "";
        b.scrollTop = b.scrollHeight;
    }
};

//ABRE E FECHA A JANELA FLUTUANTE DO CHATBOAT 
function toggleChat() {
    const c = document.getElementById('chatbot-window');
    c.style.display = c.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => { app.render(); });