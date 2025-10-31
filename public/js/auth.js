// public/js/auth.js (Versão Corrigida e Simplificada)

const auth = {
    salvarToken: (token) => localStorage.setItem('authToken', token),
    obterToken: () => localStorage.getItem('authToken'),
    salvarUsuario: (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario)),
    obterUsuario: () => JSON.parse(localStorage.getItem('usuario')),
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        window.location.reload();
    },

    checarLoginInicial: () => {
        const token = auth.obterToken();
        const usuario = auth.obterUsuario();

        if (token && usuario) {
            UI.mostrarApp();
            UI.atualizarHeaderUsuario(usuario);
            
            // CHAMA DIRETAMENTE A FUNÇÃO DE CARREGAMENTO PRINCIPAL
            main.carregarDadosIniciaisUsuario(); 
        } else {
            UI.mostrarTelaAuth();
            main.carregarDadosPublicos(); 
        }
    }
};

window.addEventListener('auth-error', () => {
    auth.logout();
    UI.exibirNotificacao('Sua sessão expirou. Por favor, faça login novamente.', 'aviso');
});