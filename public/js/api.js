// public/js/api.js

const API_BASE_URL = 'http://localhost:3001';

/**
 * Função auxiliar genérica para fazer requisições à API.
 * Ela automaticamente adiciona o token de autenticação e trata erros comuns.
 * @param {string} endpoint - O caminho da API a ser chamado (ex: '/api/veiculos').
 * @param {object} options - As opções da requisição fetch (method, body, etc.).
 * @returns {Promise<any>} Os dados JSON da resposta.
 */
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Se o token for inválido ou expirado, dispara um evento global para deslogar o usuário.
    if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        // Lança um erro para interromper a execução da função que chamou a API.
        throw new Error('Autenticação inválida ou expirada.');
    }

    // Tenta converter para JSON. Se a resposta for vazia (ex: em um DELETE), retorna um objeto vazio.
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        // Lança o erro específico retornado pelo backend.
        throw new Error(data.error || 'Ocorreu um erro na requisição.');
    }
    return data;
}

// Objeto que centraliza todas as chamadas à API da aplicação.
const api = {
    // === Autenticação ===
    login: (email, senha) => fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    register: (nome, email, senha) => fetchAPI('/api/auth/registrar', { method: 'POST', body: JSON.stringify({ nome, email, senha }) }),

    // === Veículos ===
    getVeiculosUsuario: () => fetchAPI('/api/veiculos'),
    getVeiculosPublicos: () => fetchAPI('/api/veiculos/publicos'),
    addVeiculo: (dadosVeiculo) => fetchAPI('/api/veiculos', { method: 'POST', body: JSON.stringify(dadosVeiculo) }),
    updateVeiculo: (id, dadosAtualizados) => fetchAPI(`/api/veiculos/${id}`, { method: 'PUT', body: JSON.stringify(dadosAtualizados) }),
    deleteVeiculo: (id) => fetchAPI(`/api/veiculos/${id}`, { method: 'DELETE' }),
    
    // === Compartilhamento de Veículo Específico ===
    shareVeiculo: (id, email, permissao) => fetchAPI(`/api/veiculos/${id}/share`, { method: 'POST', body: JSON.stringify({ email, permissao }) }),

    // === Manutenções ===
    getManutencoes: (veiculoId) => fetchAPI(`/api/veiculos/${veiculoId}/manutencoes`),
    addManutencao: (veiculoId, dados) => fetchAPI(`/api/veiculos/${veiculoId}/manutencoes`, { method: 'POST', body: JSON.stringify(dados) }),

    // === Amigos e Garagens Compartilhadas ===
    getAmigos: () => fetchAPI('/api/amigos'),
    addAmigo: (email) => fetchAPI('/api/amigos/pedir', { method: 'POST', body: JSON.stringify({ email }) }),
    responderPedidoAmigo: (idAmigo, resposta) => fetchAPI(`/api/amigos/responder/${idAmigo}`, { method: 'PUT', body: JSON.stringify({ resposta }) }),
    getGaragensAmigos: () => fetchAPI('/api/garagens-compartilhadas'),

    // === Perfil do Usuário ===
    updatePerfil: (dados) => fetchAPI('/api/usuarios/perfil', { method: 'PUT', body: JSON.stringify(dados) }),
    updateSenha: (dados) => fetchAPI('/api/usuarios/senha', { method: 'PUT', body: JSON.stringify(dados) }),
    deleteConta: () => fetchAPI('/api/usuarios/conta', { method: 'DELETE' }),

    // === Outros (APIs Externas via nosso Backend) ===
    getForecast: (cidade) => fetchAPI(`/api/forecast/${cidade}`),
    getDestaques: () => fetchAPI('/api/garagem/veiculos-destaque'),
    getServicos: () => fetchAPI('/api/garagem/servicos-oferecidos'),
};