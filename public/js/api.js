// public/js/api.js

const API_BASE_URL = 'http://localhost:3001';

// Função auxiliar para fazer requisições fetch com o token
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

    if (response.status === 401 || response.status === 403) {
        // Se o token for inválido, desloga o usuário
        window.dispatchEvent(new CustomEvent('auth-error'));
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro na requisição.');
    }
    return data;
}

// Funções da API
const api = {
    // Autenticação
    login: (email, senha) => fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    register: (nome, email, senha) => fetchAPI('/api/auth/registrar', { method: 'POST', body: JSON.stringify({ nome, email, senha }) }),

    // Veículos
    getVeiculosUsuario: () => fetchAPI('/api/veiculos'),
    getVeiculosPublicos: () => fetchAPI('/api/veiculos/publicos'),
    addVeiculo: (dadosVeiculo) => fetchAPI('/api/veiculos', { method: 'POST', body: JSON.stringify(dadosVeiculo) }),
    updateVeiculo: (id, dadosAtualizados) => fetchAPI(`/api/veiculos/${id}`, { method: 'PUT', body: JSON.stringify(dadosAtualizados) }),
    deleteVeiculo: (id) => fetchAPI(`/api/veiculos/${id}`, { method: 'DELETE' }),
    
    // Compartilhamento
    shareVeiculo: (id, email, permissao) => fetchAPI(`/api/veiculos/${id}/share`, { method: 'POST', body: JSON.stringify({ email, permissao }) }),

    // Amigos
    getAmigos: () => fetchAPI('/api/amigos'),
    addAmigo: (email) => fetchAPI('/api/amigos/pedir', { method: 'POST', body: JSON.stringify({ email }) }),
    responderPedidoAmigo: (idAmigo, resposta) => fetchAPI(`/api/amigos/responder/${idAmigo}`, { method: 'PUT', body: JSON.stringify({ resposta }) }),
    getGaragensAmigos: () => fetchAPI('/api/garagens-compartilhadas'),

    // Perfil
    updatePerfil: (dados) => fetchAPI('/api/usuarios/perfil', { method: 'PUT', body: JSON.stringify(dados) }),
    updateSenha: (dados) => fetchAPI('/api/usuarios/senha', { method: 'PUT', body: JSON.stringify(dados) }),
    deleteConta: () => fetchAPI('/api/usuarios/conta', { method: 'DELETE' }),

    // Outros
    getPrevisaoTempo: (cidade) => fetchAPI(`/api/forecast/${cidade}`),
};