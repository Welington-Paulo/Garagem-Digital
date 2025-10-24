// public/js/auth.js

const auth = {
    // Funções de gerenciamento da sessão do usuário
    salvarToken: (token) => localStorage.setItem('authToken', token),
    obterToken: () => localStorage.getItem('authToken'),
    salvarUsuario: (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario)),
    obterUsuario: () => JSON.parse(localStorage.getItem('usuario')),
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        // Recarrega a página para limpar todo o estado
        window.location.reload();
    },

    // Função principal que verifica o estado de login na inicialização
// Em public/js/auth.js

checarLoginInicial: async () => {
    const token = auth.obterToken();
    const usuario = auth.obterUsuario();

    if (token && usuario) {
        UI.mostrarApp();
        UI.atualizarHeaderUsuario(usuario);
        try {
            // Apenas busca e retorna os dados
            const veiculos = await api.getVeiculosUsuario();
            const amigos = await api.getAmigos();
            return { veiculos, amigos }; // Retorna os dados para quem chamou
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
            return null;
        }
    } else {
        UI.mostrarTelaAuth();
        // Carrega dados públicos se não estiver logado
        try {
            const veiculosPublicos = await api.getVeiculosPublicos();
            UI.renderizarVeiculosPublicos(veiculosPublicos);
        } catch(error) {
            console.error(error);
        }
        return null;
    }
}
};

// Listener para deslogar o usuário se o token expirar
window.addEventListener('auth-error', () => {
    auth.logout();
    UI.exibirNotificacao('Sua sessão expirou. Por favor, faça login novamente.', 'aviso');
});