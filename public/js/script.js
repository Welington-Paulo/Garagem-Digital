// JS/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CACHE DE ELEMENTOS DO DOM ---
    const userArea = document.getElementById('user-area');
    const authModal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const garagemDisplayCards = document.getElementById('garagem-display-cards');
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    // Adicione aqui outros elementos do DOM que você usa
    const notificacaoArea = document.getElementById('notificacao-area');

    const backendBaseUrl = 'http://localhost:3001';
    let currentUser = null; // Armazena dados do usuário logado

    // --- FUNÇÕES DE AUTENTICAÇÃO E GERENCIAMENTO DE TOKEN ---

    function storeUserInfo(userData) {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        currentUser = userData;
    }

    function getUserInfo() {
        const info = localStorage.getItem('userInfo');
        return info ? JSON.parse(info) : null;
    }

    function getToken() {
        const info = getUserInfo();
        return info ? info.token : null;
    }

    function logout() {
        localStorage.removeItem('userInfo');
        currentUser = null;
        updateUI();
        garagemDisplayCards.innerHTML = '<p class="placeholder">Você foi desconectado. Faça login para ver seus veículos.</p>';
    }
    
    /**
     * Função central para todas as requisições à API.
     * Ela adiciona automaticamente o token de autorização.
     */
    async function fetchApi(endpoint, options = {}) {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${backendBaseUrl}${endpoint}`, { ...options, headers });
        
        const responseData = await response.json();

        if (response.status === 401) { // Não autorizado (token inválido ou expirado)
            exibirNotificacao("Sua sessão expirou. Por favor, faça login novamente.", 'aviso');
            logout();
            throw new Error("Sessão expirou");
        }
        
        if (!response.ok) {
            throw new Error(responseData.error || `Erro na requisição: ${response.statusText}`);
        }
        
        return responseData;
    }
    
    // --- LÓGICA DOS FORMULÁRIOS DE LOGIN E REGISTRO ---

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const userData = await fetchApi('/api/users/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                storeUserInfo(userData);
                exibirNotificacao(`Bem-vindo de volta, ${userData.name}!`, 'sucesso');
                authModal.style.display = 'none';
                loginForm.reset();
                inicializarApp(); // Reinicia a aplicação no estado "logado"
            } catch (error) {
                exibirNotificacao(`Erro no login: ${error.message}`, 'erro');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            try {
                const userData = await fetchApi('/api/users/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });
                storeUserInfo(userData);
                exibirNotificacao(`Conta criada com sucesso, ${userData.name}!`, 'sucesso');
                authModal.style.display = 'none';
                registerForm.reset();
                inicializarApp();
            } catch (error) {
                exibirNotificacao(`Erro no registro: ${error.message}`, 'erro');
            }
        });
    }

    // --- LÓGICA DE ADICIONAR VEÍCULO ATUALIZADA ---
    
    if (formAddVeiculo) {
        formAddVeiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) {
                exibirNotificacao('Você precisa estar logado para adicionar um veículo.', 'aviso');
                return;
            }
            
            const fd = new FormData(formAddVeiculo);
            const dadosVeiculo = {
                placa: fd.get('placa')?.toUpperCase().trim().replace(/-/g, ''),
                marca: fd.get('marca')?.trim(),
                modelo: fd.get('modelo')?.trim(),
                ano: fd.get('ano') ? parseInt(fd.get('ano')) : null,
                cor: fd.get('cor')?.trim() || "Não informada",
                tipoVeiculo: fd.get('tipo-veiculo'),
                isPublic: document.getElementById('is-public').checked, // Pega o valor do novo checkbox
                detalhes: {}
            };
            // Lógica para detalhes específicos (carro, caminhão, etc.)
            // ...

            try {
                const resultado = await fetchApi('/api/veiculos', {
                    method: 'POST',
                    body: JSON.stringify(dadosVeiculo),
                });
                exibirNotificacao(`Veículo ${resultado.modelo} adicionado!`, 'sucesso');
                formAddVeiculo.reset();
                await carregarVeiculosDoBackend(); // Atualiza a lista da garagem
            } catch (error) {
                // A mensagem de erro agora vem diretamente da função fetchApi
                exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, 'erro');
            }
        });
    }

    // --- FUNÇÕES DE UI E RENDERIZAÇÃO ---
    
    function updateUI() {
        if (userArea) {
            userArea.innerHTML = ''; // Limpa a área
            if (currentUser) {
                // Usuário está logado
                const welcomeText = document.createElement('span');
                welcomeText.textContent = `Olá, ${currentUser.name}`;
                
                const logoutButton = document.createElement('button');
                logoutButton.className = 'auth-button logout';
                logoutButton.textContent = 'Sair';
                logoutButton.onclick = logout;
                
                userArea.appendChild(welcomeText);
                userArea.appendChild(logoutButton);
            } else {
                // Usuário deslogado
                const loginButton = document.createElement('button');
                loginButton.className = 'auth-button';
                loginButton.textContent = 'Entrar / Criar Conta';
                loginButton.onclick = () => {
                    authModal.style.display = 'flex';
                    showAuthForm('login');
                };
                userArea.appendChild(loginButton);
            }
        }
    }
    
    async function carregarVeiculosDoBackend() {
        if (!garagemDisplayCards) return;
        garagemDisplayCards.innerHTML = '<p class="placeholder">Carregando seus veículos...</p>';
        try {
            const veiculos = await fetchApi('/api/veiculos'); // Usa a função segura
            if (veiculos.length === 0) {
                garagemDisplayCards.innerHTML = '<p class="placeholder">Nenhum veículo na garagem. Adicione um!</p>';
                return;
            }
            
            let cardsHtml = '';
            veiculos.forEach(v => {
                const isOwner = currentUser && v.owner && v.owner._id === currentUser._id;
                cardsHtml += `
                    <div class="veiculo-card ${isOwner ? 'owner' : ''}">
                        <h4>${v.modelo} (${v.marca}) - ${v.ano}</h4>
                        <p>Placa: ${v.placa}</p>
                        <p>Dono: ${v.owner ? v.owner.name : 'Desconhecido'}</p>
                        <p>Visibilidade: ${v.isPublic ? 'Público' : 'Privado'}</p>
                        <div class="card-actions">
                            ${isOwner ? `
                                <button class="btn-card-editar" onclick="abrirModalEdicao('${v._id}')">Editar</button>
                                <button class="btn-card-remover" onclick="confirmarRemocaoVeiculo('${v._id}')">Remover</button>
                            ` : `<button class="btn-card-selecionar" data-placa="${v.placa}">Ver</button>`
                            }
                        </div>
                    </div>
                `;
            });
            garagemDisplayCards.innerHTML = cardsHtml;
        } catch (error) {
            garagemDisplayCards.innerHTML = `<p class="placeholder erro">Erro ao carregar veículos: ${error.message}</p>`;
        }
    }

    // Função de notificação (sem alterações)
    function exibirNotificacao(mensagem, tipo = 'info', duracao = 4000) {
        if (!notificacaoArea) return;
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo} show`;
        notificacao.innerHTML = `<span>${mensagem}</span>`;
        notificacaoArea.appendChild(notificacao);
        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => notificacao.remove(), 500);
        }, duracao);
    }
    
    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    function inicializarApp() {
        currentUser = getUserInfo(); // Verifica se já existe um usuário logado no localStorage
        updateUI(); // Atualiza a UI (botão de login/logout, etc.)

        if (currentUser) {
            // Se o usuário estiver logado, carrega os dados dele
            carregarVeiculosDoBackend();
            // Chame outras funções de carregamento aqui
        } else {
            // Se não estiver logado, exibe uma mensagem
            if (garagemDisplayCards) {
                garagemDisplayCards.innerHTML = '<p class="placeholder">Faça login para gerenciar e ver os veículos.</p>';
            }
        }
        console.log("Aplicação inicializada.");
    }
    
    inicializarApp(); // Inicia tudo!
});