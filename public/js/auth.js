// public/js/auth.js

const auth = {
    // ==================
    // Gerenciamento de Token e Sessão
    // ==================
    salvarToken: (token) => localStorage.setItem('authToken', token),
    
    obterToken: () => localStorage.getItem('authToken'),
    
    salvarUsuario: (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario)),
    
    obterUsuario: () => {
        try {
            return JSON.parse(localStorage.getItem('usuario'));
        } catch (e) {
            return null;
        }
    },

    // ==================
    // Controle de Estado (Login/Logout)
    // ==================
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        
        // Limpa dados da memória do frontend por segurança
        if (typeof main !== 'undefined') {
            main.setVeiculos([]);
            main.setAmigos([]);
        }

        // Revalida a interface
        auth.checkAuthState();
        
        // Feedback visual
        if (typeof UI !== 'undefined') {
            UI.exibirNotificacao("Você saiu da conta.", "info");
        }
    },

    // ==================
    // Função Principal da Fase 1: Interface Reativa
    // ==================
    checkAuthState: () => {
        const token = auth.obterToken();
        const usuario = auth.obterUsuario();

        if (token && usuario) {
            // --- ESTADO: LOGADO ---
            console.log("Usuário autenticado. Carregando aplicação...");
            
            // 1. Atualiza a UI para mostrar o App e esconder o Login
            UI.mostrarApp();
            
            // 2. Atualiza o Header com foto e nome
            UI.atualizarHeaderUsuario(usuario);
            
            // 3. Carrega os dados privados (Veículos, Amigos)
            // Verificamos se o 'main' já está carregado para evitar erros de ordem de script
            if (typeof main !== 'undefined') {
                main.carregarDadosIniciaisUsuario();
            }

        } else {
            // --- ESTADO: VISITANTE / DESLOGADO ---
            console.log("Usuário não autenticado. Mostrando tela de login.");
            
            // 1. Mostra formulários de Login/Registro
            UI.mostrarTelaAuth();
            
            // 2. Opcional: Carrega dados públicos (Vitrine) para o visitante não ver uma tela vazia
            // (Se desejar que visitantes vejam a vitrine, descomente a linha abaixo)
            // if (typeof main !== 'undefined') main.carregarDadosRecursos();
        }
    }
};

// ==================
// Listener Global de Erros de Autenticação
// ==================
// Disparado pelo api.js quando recebe 401 ou 403
window.addEventListener('auth-error', () => {
    console.warn("Sessão expirada ou inválida detectada.");
    localStorage.removeItem('authToken'); // Remove o token inválido
    auth.checkAuthState(); // Força a atualização da interface para a tela de login
    
    if (typeof UI !== 'undefined') {
        UI.exibirNotificacao('Sua sessão expirou. Por favor, faça login novamente.', 'aviso');
    }
});