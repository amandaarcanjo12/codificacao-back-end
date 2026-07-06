const auth = {

    //PARA ENTRAR NO SISTEMA
    async login() {
        const u = document.getElementById('user-login').value;
        const p = document.getElementById('pass-login').value;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u, p })
        });

        const data = await response.json();
        if (data.sucesso) {
            location.reload();
        } else {
            alert("Credenciais inválidas! (admin / 123)");
        }
    },

    //SAIR DO SISTEMA
    async logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        location.reload();
    },

    //VERIFICA QUEM ESTÁ LOGADO
    async check() {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        const section = document.getElementById('auth-section');
        if (data.user) {
            section.innerHTML = `<span class=\"text-white me-2 small\">Olá, <b>${data.user}</b></span><button class=\"btn btn-sm btn-danger\" onclick=\"auth.logout()\">Sair</button>`;
        } else {
            section.innerHTML = `<button class=\"btn btn-sm btn-outline-light\" onclick=\"auth.toggleLoginForm()\">Login</button>`;
        }
    },

    //MOSTRA OU ESCONDE O FORMULÁRIO
    toggleLoginForm() {
        const el = document.getElementById('login-container');
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => auth.check());