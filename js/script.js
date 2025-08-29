// JS/script.js
document.addEventListener('DOMContentLoaded', () => {
    // Assumindo que as classes Garagem, Veiculo, Carro, CarroEsportivo, Caminhao, Manutencao
    // estão definidas em seus respectivos arquivos .js e carregadas antes deste script no HTML.
    const garagem = new Garagem();

    // --- Elementos do DOM (Cache) ---
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
    const camposEspecificosDivs = document.querySelectorAll('.campos-especificos');
    const garagemDisplayCards = document.getElementById('garagem-display-cards');
    
    const agendamentosFuturosViewDiv = document.getElementById('agendamentos-futuros-view');
    const lembretesManutencaoViewDiv = document.getElementById('lembretes-manutencao-view');
    const historicosConsolidadosViewDiv = document.getElementById('historicos-consolidados-view');
    const notificacaoArea = document.getElementById('notificacao-area');

    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const mainNav = document.getElementById('main-nav');

    const nomeVeiculoInteracaoSpan = document.getElementById('nome-veiculo-interacao');
    const divInfoVeiculoSelecionado = document.getElementById('informacoesVeiculoSelecionado');
    const divBotoesAcoesComuns = document.getElementById('botoesAcoesComuns');
    const divBotoesAcoesEspecificas = document.getElementById('botoesAcoesEspecificas');
    const ulLogInteracoes = document.getElementById('logInteracoesVeiculo');

    const selectViagemVeiculo = document.getElementById('viagem-veiculo');
    const cityInputViagem = document.getElementById('cityInputViagem');
    const searchButtonViagem = document.getElementById('searchButtonViagem');
    const weatherResultDivViagem = document.getElementById('weatherResultViagem');
    const errorMessageDivViagem = document.getElementById('errorMessageViagem');

    const controlesPrevisaoDiv = document.getElementById('controles-previsao');
    const filtroDiasButtons = document.querySelectorAll('.btn-filtro-dias');
    const destaqueChuvaCheckbox = document.getElementById('destaque-chuva');
    const destaqueTempBaixaCheckbox = document.getElementById('destaque-temp-baixa');
    const destaqueTempAltaCheckbox = document.getElementById('destaque-temp-alta');

    const cardsVeiculosDestaqueDiv = document.getElementById('cards-veiculos-destaque');
    const listaServicosOferecidosUl = document.getElementById('lista-servicos-oferecidos');
    const filtroTipoVeiculoDicaSelect = document.getElementById('filtro-tipo-veiculo-dica');
    const dicasManutencaoViewDiv = document.getElementById('dicas-manutencao-view');

    const modalEditarVeiculo = document.getElementById('modal-editar-veiculo');
    const formEditarVeiculo = document.getElementById('form-editar-veiculo');
    const editarVeiculoIdInput = document.getElementById('editar-veiculo-id');
    const modalEditarTituloSpan = document.getElementById('modal-editar-veiculo-titulo');
    const camposEspecificosEditarDivs = document.querySelectorAll('.campos-especificos-editar');

    // **NOVOS** Elementos para a Seção de Manutenção
    const secaoManutencao = document.getElementById('secao-manutencao-veiculo');
    const listaManutencoesDiv = document.getElementById('lista-manutencoes-veiculo');
    const formAddManutencao = document.getElementById('form-add-manutencao');
    const manutencaoVeiculoIdInput = document.getElementById('manutencao-veiculo-id');

    let filtroDiasAtivo = 5;
    let destacarChuva = false;
    let destacarTempBaixa = false;
    let destacarTempAlta = false;
    let dadosCompletosForecastCache = null;
    let cidadeCache = "";
    let todasAsDicasCache = [];

    const backendBaseUrl = 'http://localhost:3001'; 
    let isSubmitting = false;

    function _renderFeatherIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace({ width: '1em', height: '1em', class: 'feather-icon-inline' });
        }
    }

    // --- Lógica do Menu Hambúrguer e Abas (sem alterações) ---
    if (menuHamburgerBtn && mainNav && menuCloseBtn) {
        menuHamburgerBtn.addEventListener('click', () => {
            mainNav.setAttribute('data-visible', 'true');
            menuHamburgerBtn.setAttribute('aria-expanded', 'true');
        });
        menuCloseBtn.addEventListener('click', () => {
            mainNav.setAttribute('data-visible', 'false');
            menuHamburgerBtn.setAttribute('aria-expanded', 'false');
        });
    }
    if (navButtons && tabContents) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                navButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                const targetId = button.dataset.target;
                const targetTab = document.getElementById(targetId);
                if (targetTab) {
                    targetTab.classList.add('active');
                } else {
                    console.warn(`Aba com ID "${targetId}" não encontrada.`);
                }
                if (mainNav && mainNav.getAttribute('data-visible') === 'true') {
                    mainNav.setAttribute('data-visible', 'false');
                    if(menuHamburgerBtn) menuHamburgerBtn.setAttribute('aria-expanded', 'false');
                }
                _renderFeatherIcons();
            });
        });
    }

    // --- Sistema de Notificação (Toast - sem alterações) ---
    function exibirNotificacao(mensagem, tipo = 'info', duracao = 4000) {
        if (!notificacaoArea) { console.warn("Área de notificação (#notificacao-area) não encontrada."); return; }
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        let iconName = 'info';
        if (tipo === 'sucesso') iconName = 'check-circle';
        else if (tipo === 'erro') iconName = 'x-octagon';
        else if (tipo === 'aviso') iconName = 'alert-triangle';
        notificacao.innerHTML = `<i data-feather="${iconName}"></i> <span style="margin-left: 10px;">${mensagem}</span>`;
        notificacaoArea.appendChild(notificacao);
        _renderFeatherIcons();
        void notificacao.offsetWidth; 
        notificacao.classList.add('show');
        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => { if (notificacao.parentNode) notificacao.parentNode.removeChild(notificacao); }, 500);
        }, duracao);
    }

    // --- API Simulada de Detalhes Veiculares (mantida) ---
    async function buscarDetalhesVeiculoApiSimulada(placa) {
        try {
            const response = await fetch('./data/api_veiculos_detalhes.json'); 
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const todosOsDetalhes = await response.json();
            return todosOsDetalhes[placa.toUpperCase().replace(/-/g, '')] || null;
        } catch (error) {
            console.error("Erro ao buscar detalhes na API simulada:", error);
            return null;
        }
    }

    // --- Renderização e Atualização da UI ---
    function renderizarTudoUI() {
        renderizarCardsVeiculosUI();
        atualizarPainelInteracaoUI(); 
        // ATENÇÃO: A lógica destas funções de consulta precisará ser adaptada
        // para buscar os dados de manutenção via API, se necessário.
        // Por enquanto, elas foram mantidas mas podem não refletir os dados do backend.
        renderizarAgendamentosFuturosView();
        renderizarLembretesManutencaoView();
        renderizarHistoricosConsolidadosView();
        preencherSelectVeiculosViagem();
    }

    function renderizarCardsVeiculosUI() {
        if (!garagemDisplayCards) return;
        garagemDisplayCards.innerHTML = garagem.listarVeiculosParaCards();
        document.querySelectorAll('.btn-card-selecionar').forEach(button => {
            button.addEventListener('click', (e) => {
                const placa = e.target.dataset.placa;
                if (garagem.selecionarVeiculoPorPlaca(placa)) { 
                    atualizarPainelInteracaoUI(); 
                    renderizarCardsVeiculosUI(); 
                }
            });
        });
        _renderFeatherIcons();
    }
    
    async function atualizarPainelInteracaoUI() {
        const veiculo = garagem.getVeiculoSelecionado();
        if (!nomeVeiculoInteracaoSpan || !divInfoVeiculoSelecionado) return;
            
        if (veiculo) {
            nomeVeiculoInteracaoSpan.textContent = `${veiculo.constructor.name} ${veiculo.modelo} (${veiculo.placa})`;
            divInfoVeiculoSelecionado.innerHTML = veiculo.exibirInformacoes(); 
            
            const carregandoDetalhesSpan = document.createElement('p');
            carregandoDetalhesSpan.id = 'loading-api-details';
            carregandoDetalhesSpan.innerHTML = '<i data-feather="loader" class="spin"></i> Buscando detalhes adicionais...';
            const hrExistente = divInfoVeiculoSelecionado.querySelector('.info-divider');
            if (hrExistente) divInfoVeiculoSelecionado.insertBefore(carregandoDetalhesSpan, hrExistente);
            else divInfoVeiculoSelecionado.appendChild(carregandoDetalhesSpan);
            _renderFeatherIcons();

            const detalhesApi = await buscarDetalhesVeiculoApiSimulada(veiculo.placa);
            const loadingSpanToRemove = document.getElementById('loading-api-details');
            if (loadingSpanToRemove) loadingSpanToRemove.remove();

            if (detalhesApi) {
                if (typeof veiculo.atualizarDetalhesDaApi === 'function') {
                    veiculo.atualizarDetalhesDaApi(detalhesApi);
                }
            }
            divInfoVeiculoSelecionado.innerHTML = veiculo.exibirInformacoes();

            document.querySelectorAll('.acao-especifica').forEach(el => el.style.display = 'none');
            if (veiculo instanceof CarroEsportivo) {
                document.querySelectorAll('.carroesportivo-action').forEach(el => el.style.display = (el.classList.contains('acao-com-input') ? 'flex' : 'inline-block'));
            } else if (veiculo instanceof Caminhao) {
                document.querySelectorAll('.caminhao-action').forEach(el => el.style.display = (el.classList.contains('acao-com-input') ? 'flex' : 'inline-block'));
            }
            if(divBotoesAcoesComuns) divBotoesAcoesComuns.style.display = 'block';
            if(divBotoesAcoesEspecificas) divBotoesAcoesEspecificas.style.display = 'block';

            // **NOVO**: Exibir e carregar a seção de manutenção
            if(secaoManutencao && manutencaoVeiculoIdInput) {
                secaoManutencao.style.display = 'block';
                manutencaoVeiculoIdInput.value = veiculo.id;
                const dataInput = document.getElementById('manutencao-data');
                if(dataInput) dataInput.value = new Date().toISOString().split('T')[0];
                carregarEExibirManutencoes(veiculo.id);
            }

        } else {
            nomeVeiculoInteracaoSpan.textContent = "Nenhum";
            divInfoVeiculoSelecionado.innerHTML = "<p>Selecione um veículo na aba \"Minha Garagem\" para interagir.</p>";
            if(divBotoesAcoesComuns) divBotoesAcoesComuns.style.display = 'none';
            if(divBotoesAcoesEspecificas) divBotoesAcoesEspecificas.style.display = 'none';
            if (secaoManutencao) secaoManutencao.style.display = 'none'; // Esconde a nova seção
        }
        window.atualizarLogInteracoesUI();
        _renderFeatherIcons();
    }

    window.atualizarLogInteracoesUI = function() { 
        if (!ulLogInteracoes) return;
        ulLogInteracoes.innerHTML = garagem.getHistoricoInteracoesFormatado();
    }

    // Lógica das abas de Consultas (precisaria ser adaptada para usar a API)
    function renderizarAgendamentosFuturosView() { if (!agendamentosFuturosViewDiv) return; agendamentosFuturosViewDiv.innerHTML = '<p>Funcionalidade em desenvolvimento.</p>'; }
    function renderizarLembretesManutencaoView() { if (!lembretesManutencaoViewDiv) return; lembretesManutencaoViewDiv.innerHTML = '<p>Funcionalidade em desenvolvimento.</p>'; }
    function renderizarHistoricosConsolidadosView() { if (!historicosConsolidadosViewDiv) return; historicosConsolidadosViewDiv.innerHTML = '<p>Funcionalidade em desenvolvimento.</p>'; }

    function preencherSelectVeiculosViagem() { 
        if (!selectViagemVeiculo) return;
        const valAnt = selectViagemVeiculo.value;
        selectViagemVeiculo.innerHTML = '<option value="">-- Selecione um Veículo --</option>';
        garagem.veiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.placa;
            opt.textContent = `${v.constructor.name} ${v.modelo} (${v.placa})`;
            selectViagemVeiculo.appendChild(opt);
        });
        if (garagem.encontrarVeiculo(valAnt)) selectViagemVeiculo.value = valAnt;
    }

    // --- Lógica de Adicionar Veículo (sem alterações) ---
    if (tipoVeiculoSelect) tipoVeiculoSelect.addEventListener('change', () => { 
        if (!camposEspecificosDivs) return;
        camposEspecificosDivs.forEach(div => div.style.display = 'none');
        const valorSelecionado = tipoVeiculoSelect.value.toLowerCase();
        if (valorSelecionado) { 
            const divToShow = document.getElementById(`campos-${valorSelecionado}`);
            if (divToShow) divToShow.style.display = 'block';
        }
    });

    if (formAddVeiculo) { 
        formAddVeiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            isSubmitting = true; 
            const submitButton = formAddVeiculo.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i data-feather="loader" class="spin"></i> Salvando...';
                _renderFeatherIcons();
            }
            const fd = new FormData(formAddVeiculo);
            const dadosVeiculo = {
                placa: fd.get('placa')?.toUpperCase().trim().replace(/-/g, ''),
                marca: fd.get('marca')?.trim(),
                modelo: fd.get('modelo')?.trim(),
                ano: fd.get('ano') ? parseInt(fd.get('ano')) : null,
                cor: fd.get('cor')?.trim() || "Não informada",
                tipoVeiculo: fd.get('tipo-veiculo'),
                detalhes: {}
            };
            if (!dadosVeiculo.tipoVeiculo || !dadosVeiculo.marca || !dadosVeiculo.modelo || !dadosVeiculo.ano || !dadosVeiculo.placa) {
                exibirNotificacao("Por favor, preencha todos os campos obrigatórios.", 'erro');
                isSubmitting = false; 
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
                    _renderFeatherIcons();
                }
                return;
            }
            switch (dadosVeiculo.tipoVeiculo) {
                case 'Carro': dadosVeiculo.detalhes.numeroPortas = parseInt(fd.get('numero-portas')) || 4; break;
                case 'CarroEsportivo': dadosVeiculo.detalhes.velocidadeMaximaTurbo = parseInt(fd.get('velocidade-maxima-turbo')) || 250; break;
                case 'Caminhao': dadosVeiculo.detalhes.capacidadeCarga = parseFloat(fd.get('capacidade-carga')) || 1000; break;
            }
            try {
                const response = await fetch(`${backendBaseUrl}/api/veiculos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosVeiculo),
                });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error);
                exibirNotificacao(`Veículo ${resultado.modelo} adicionado com sucesso!`, 'sucesso');
                formAddVeiculo.reset();
                if(tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change'));
                await carregarVeiculosDoBackend(); 
            } catch (error) {
                exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, 'erro');
                console.error("Erro no POST do veículo:", error);
            } finally {
                isSubmitting = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
                    _renderFeatherIcons();
                }
            }
        });
    }

    // --- Lógica de Interação com Veículo (sem alterações) ---
    const todosBotoesDeAcao = [ 
        ...(divBotoesAcoesComuns ? divBotoesAcoesComuns.querySelectorAll('button[data-acao]') : []),
        ...(divBotoesAcoesEspecificas ? divBotoesAcoesEspecificas.querySelectorAll('button[data-acao], .acao-com-input button[data-acao]') : [])
    ];
    todosBotoesDeAcao.forEach(button => { 
        button.addEventListener('click', () => {
            const veiculoSel = garagem.getVeiculoSelecionado();
            if (!veiculoSel) { exibirNotificacao("Nenhum veículo selecionado para interagir.", "aviso"); return; }
            const acao = button.dataset.acao; 
            let valor = null;
            const inputCargaEl = document.getElementById('input-carga'); 
            const inputDescargaEl = document.getElementById('input-descarga');
            if (acao === "carregar" && inputCargaEl) valor = inputCargaEl.value;
            else if (acao === "descarregar" && inputDescargaEl) valor = inputDescargaEl.value;
            garagem.interagirComSelecionado(acao, valor); 
            atualizarPainelInteracaoUI(); 
            renderizarCardsVeiculosUI(); 
        });
    });

    // --- **NOVA** Lógica de Manutenção ---

    /**
     * Carrega as manutenções de um veículo do backend e as exibe na tela.
     * @param {string} veiculoId O ID do veículo.
     */
    async function carregarEExibirManutencoes(veiculoId) {
        if (!listaManutencoesDiv) return;
        listaManutencoesDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando histórico...</p>`;
        _renderFeatherIcons();

        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${veiculoId}/manutencoes`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Erro HTTP ${response.status}`);
            }
            const manutencoes = await response.json();

            if (manutencoes.length === 0) {
                listaManutencoesDiv.innerHTML = '<p class="placeholder">Nenhum registro de manutenção encontrado.</p>';
                return;
            }

            let html = '<ul>';
            manutencoes.forEach(m => {
                const dataFormatada = new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const custoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.custo);
                html += `
                    <li class="manutencao-item">
                        <div class="manutencao-info">
                            <strong>${m.descricaoServico}</strong>
                            <span>${dataFormatada} - ${custoFormatado}</span>
                        </div>
                        ${m.quilometragem ? `<span class="manutencao-km">${m.quilometragem.toLocaleString('pt-BR')} km</span>` : ''}
                    </li>
                `;
            });
            html += '</ul>';
            listaManutencoesDiv.innerHTML = html;

        } catch (error) {
            console.error("Erro ao carregar manutenções:", error);
            listaManutencoesDiv.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> Falha ao carregar histórico: ${error.message}</p>`;
            _renderFeatherIcons();
        }
    }

    // Event listener para o novo formulário de manutenção
    if (formAddManutencao) {
        formAddManutencao.addEventListener('submit', async (e) => {
            e.preventDefault();
            const veiculoId = manutencaoVeiculoIdInput.value;
            if (!veiculoId) {
                exibirNotificacao("ID do veículo não encontrado. Selecione um veículo.", 'erro');
                return;
            }

            const submitButton = formAddManutencao.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i data-feather="loader" class="spin"></i> Salvando...';
            _renderFeatherIcons();

            const dadosFormulario = {
                descricaoServico: document.getElementById('manutencao-descricao').value,
                data: document.getElementById('manutencao-data').value,
                custo: parseFloat(document.getElementById('manutencao-custo').value),
                quilometragem: document.getElementById('manutencao-km').value ? parseInt(document.getElementById('manutencao-km').value) : undefined
            };
            
            if (isNaN(dadosFormulario.quilometragem)) {
                delete dadosFormulario.quilometragem;
            }

            try {
                const response = await fetch(`${backendBaseUrl}/api/veiculos/${veiculoId}/manutencoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosFormulario),
                });
                const resultado = await response.json();
                if (!response.ok) {
                    throw new Error(resultado.error || `Erro HTTP ${response.status}`);
                }
                exibirNotificacao('Manutenção adicionada com sucesso!', 'sucesso');
                formAddManutencao.reset();
                const dataInput = document.getElementById('manutencao-data');
                if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];
                await carregarEExibirManutencoes(veiculoId);
            } catch (error) {
                exibirNotificacao(`Erro ao salvar manutenção: ${error.message}`, 'erro');
                console.error('Erro no POST de manutenção:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i data-feather="save"></i> Salvar Manutenção';
                _renderFeatherIcons();
            }
        });
    }

    // Lógica de Remover Veículo
    window.confirmarRemocaoVeiculo = async (id, modeloInfo) => { 
        if (confirm(`Tem certeza que deseja remover ${modeloInfo}? Esta ação não pode ser desfeita.`)) {
            try {
                const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, {
                    method: 'DELETE',
                });
                const resultado = await response.json();
                if (!response.ok) {
                    throw new Error(resultado.error || 'Erro ao remover veículo.');
                }
                exibirNotificacao(resultado.message, 'sucesso');
                await carregarVeiculosDoBackend();
            } catch (error) {
                exibirNotificacao(error.message, 'erro');
            }
        }
    };

    // Lógica de Edição de Veículo (sem alterações)
    window.abrirModalEdicao = (id) => {
        const veiculo = garagem.encontrarVeiculoPorId(id);
        if (veiculo && modalEditarVeiculo) {
            modalEditarTituloSpan.textContent = `${veiculo.modelo} (${veiculo.placa})`;
            editarVeiculoIdInput.value = veiculo.id;
            document.getElementById('editar-marca').value = veiculo.marca;
            document.getElementById('editar-modelo').value = veiculo.modelo;
            document.getElementById('editar-ano').value = veiculo.ano;
            document.getElementById('editar-cor').value = veiculo.cor;
            camposEspecificosEditarDivs.forEach(div => div.style.display = 'none');
            const tipo = veiculo.constructor.name;
            if (tipo === 'Carro' || tipo === 'CarroEsportivo') {
                 document.getElementById('campos-editar-carro').style.display = 'block';
                 document.getElementById('editar-numero-portas').value = veiculo.numeroPortas || '';
            }
            if (tipo === 'CarroEsportivo') {
                 document.getElementById('campos-editar-carroesportivo').style.display = 'block';
                 document.getElementById('editar-velocidade-maxima-turbo').value = veiculo.velocidadeMaximaTurbo || '';
            }
            if (tipo === 'Caminhao') {
                 document.getElementById('campos-editar-caminhao').style.display = 'block';
                 document.getElementById('editar-capacidade-carga').value = veiculo.capacidadeCarga || '';
            }
            modalEditarVeiculo.style.display = 'block';
            _renderFeatherIcons();
        } else {
            exibirNotificacao("Não foi possível encontrar o veículo para editar.", 'erro');
        }
    };
    window.fecharModalEdicao = () => { if(modalEditarVeiculo) modalEditarVeiculo.style.display = 'none'; };
    window.addEventListener('click', (event) => { if (modalEditarVeiculo && event.target === modalEditarVeiculo) fecharModalEdicao(); });
    if(formEditarVeiculo) {
        formEditarVeiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editarVeiculoIdInput.value;
            const submitButton = formEditarVeiculo.querySelector('button[type="submit"]');
            const dadosAtualizados = {
                marca: document.getElementById('editar-marca').value.trim(),
                modelo: document.getElementById('editar-modelo').value.trim(),
                ano: parseInt(document.getElementById('editar-ano').value),
                cor: document.getElementById('editar-cor').value.trim() || "Não informada",
                detalhes: {}
            };
            const numPortasInput = document.getElementById('editar-numero-portas');
            if (numPortasInput && numPortasInput.closest('.campos-especificos-editar').style.display !== 'none') dadosAtualizados.detalhes.numeroPortas = parseInt(numPortasInput.value);
            const velTurboInput = document.getElementById('editar-velocidade-maxima-turbo');
            if (velTurboInput && velTurboInput.closest('.campos-especificos-editar').style.display !== 'none') dadosAtualizados.detalhes.velocidadeMaximaTurbo = parseInt(velTurboInput.value);
            const cargaInput = document.getElementById('editar-capacidade-carga');
            if (cargaInput && cargaInput.closest('.campos-especificos-editar').style.display !== 'none') dadosAtualizados.detalhes.capacidadeCarga = parseFloat(cargaInput.value);
            submitButton.disabled = true;
            submitButton.innerHTML = '<i data-feather="loader" class="spin"></i> Salvando...';
            _renderFeatherIcons();
            try {
                const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados),
                });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error || `Erro ${response.status} ao atualizar veículo.`);
                exibirNotificacao(`Veículo ${resultado.modelo} atualizado com sucesso!`, 'sucesso');
                fecharModalEdicao();
                await carregarVeiculosDoBackend();
            } catch (error) {
                exibirNotificacao(`Erro ao atualizar veículo: ${error.message}`, 'erro');
                console.error("Erro no PUT do veículo:", error);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i data-feather="save"></i> Salvar Alterações';
                _renderFeatherIcons();
            }
        });
    }

    // --- Lógica do Planejador de Viagem ---
    async function fetchWeatherFromBackend(city, type = 'forecast') {
        if (!cityInputViagem || !weatherResultDivViagem || !searchButtonViagem || !errorMessageDivViagem) {
            console.error("Elementos do DOM do planejador de viagem não encontrados."); return null;
        }
        if (!city) {
            errorMessageDivViagem.textContent = 'Por favor, digite o nome de uma cidade.';
            errorMessageViagem.style.display = 'block';
            weatherResultDivViagem.innerHTML = '<p class="placeholder">Digite uma cidade.</p>';
            return null;
        }
        const backendPort = 3001;
        const backendApiUrl = `http://localhost:${backendPort}/api/${type}/${encodeURIComponent(city)}`;

        weatherResultDivViagem.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Buscando ${type === 'forecast' ? 'previsão detalhada' : 'clima atual'} para ${city}...</p>`;
        _renderFeatherIcons();
        errorMessageDivViagem.style.display = 'none';
        searchButtonViagem.disabled = true;
        if (controlesPrevisaoDiv && type === 'forecast') controlesPrevisaoDiv.style.display = 'none';

        try {
            const response = await fetch(backendApiUrl);
            const data = await response.json(); 
            if (!response.ok) throw new Error(data.error || `Erro ${response.status} do backend.`);
            return data;
        } catch (error) {
            console.error(`[FRONTEND] Erro ao buscar ${type} para "${city}" via backend:`, error);
            errorMessageDivViagem.textContent = `Falha: ${error.message}`;
            errorMessageDivViagem.style.display = 'block';
            weatherResultDivViagem.innerHTML = `<p class="placeholder"><i data-feather="alert-octagon"></i> Falha ao carregar dados.</p>`;
            _renderFeatherIcons();
            return null;
        } finally {
            if (searchButtonViagem) searchButtonViagem.disabled = false;
        }
    }
    
    function processarDadosForecast(dataForecast) {
        if (!dataForecast || !dataForecast.list || dataForecast.list.length === 0) return null;
        const previsoesPorDia = {};
        dataForecast.list.forEach(item => {
            const dataHora = new Date(item.dt * 1000); const diaKey = dataHora.toISOString().split('T')[0];
            if (!previsoesPorDia[diaKey]) {
                previsoesPorDia[diaKey] = {
                    dataObj: dataHora, dataFormatada: dataHora.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
                    temperaturas: [], descricoes: [], icones: [], previsoesHorarias: []
                };
            }
            previsoesPorDia[diaKey].temperaturas.push(item.main.temp);
            previsoesPorDia[diaKey].descricoes.push(item.weather[0].description.toLowerCase());
            previsoesPorDia[diaKey].icones.push(item.weather[0].icon);
            previsoesPorDia[diaKey].previsoesHorarias.push({
                hora: dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                temp: item.main.temp.toFixed(1), descricao: item.weather[0].description, icone: item.weather[0].icon,
                umidade: item.main.humidity, vento: (item.wind.speed * 3.6).toFixed(1)
            });
        });
        return Object.values(previsoesPorDia).map(diaInfo => {
            let idxRep = Math.floor(diaInfo.previsoesHorarias.length / 2);
            const meioDiaIdx = diaInfo.previsoesHorarias.findIndex(p => p.hora === "12:00" || p.hora === "15:00");
            if (meioDiaIdx !== -1) idxRep = meioDiaIdx;
            const previsaoRepresentativa = diaInfo.previsoesHorarias[idxRep] || diaInfo.previsoesHorarias[0] || {descricao: 'N/A', icone: '01d'};
            return {
                dataFormatada: diaInfo.dataFormatada, temp_min: Math.min(...diaInfo.temperaturas),
                temp_max: Math.max(...diaInfo.temperaturas), descricaoGeral: previsaoRepresentativa.descricao,
                iconeGeral: previsaoRepresentativa.icone, previsoesHorarias: diaInfo.previsoesHorarias,
                temChuva: diaInfo.descricoes.some(d => d.includes('chuva') || d.includes('rain') || d.includes('drizzle') || d.includes('tempestade') || d.includes('thunderstorm'))
            };
        });
    }

    function exibirPrevisaoDetalhadaUI(previsaoProcessada, nomeCidadeApi) {
        const resultadoDiv = weatherResultDivViagem || document.getElementById('previsao-tempo-resultado');
        if (!resultadoDiv) { console.warn("Elemento para exibir previsão não encontrado."); return;}
        resultadoDiv.innerHTML = '';
        if (!previsaoProcessada || previsaoProcessada.length === 0) {
            resultadoDiv.innerHTML = `<p><i data-feather="alert-triangle" class="feather-small"></i> Sem previsão para ${nomeCidadeApi}.</p>`;
            if(controlesPrevisaoDiv) controlesPrevisaoDiv.style.display = 'none';
            _renderFeatherIcons(); return;
        }
        if(controlesPrevisaoDiv) controlesPrevisaoDiv.style.display = 'block';
        let html = `<h3><i data-feather="calendar"></i> Previsão para ${nomeCidadeApi}</h3><div class="forecast-container">`;
        let diasParaExibir = previsaoProcessada;
        if (controlesPrevisaoDiv && controlesPrevisaoDiv.style.display === 'block') {
            if (filtroDiasAtivo === 1) diasParaExibir = previsaoProcessada.slice(0, 1);
            else if (filtroDiasAtivo === 2) diasParaExibir = previsaoProcessada.slice(0, 2);
            else if (filtroDiasAtivo === 3) diasParaExibir = previsaoProcessada.slice(0, 3);
            else diasParaExibir = previsaoProcessada.slice(0, 5);
        } else diasParaExibir = previsaoProcessada.slice(0,5);

        diasParaExibir.forEach((dia, index) => {
            let classes = "forecast-day-card";
            const tempMinNum = parseFloat(dia.temp_min);
            const tempMaxNum = parseFloat(dia.temp_max);
            if (destacarChuva && dia.temChuva) classes += " destaque-chuva";
            if (destacarTempBaixa && destaqueTempBaixaCheckbox && tempMinNum < parseFloat(destaqueTempBaixaCheckbox.dataset.tempLimite)) classes += " destaque-temp-baixa";
            if (destacarTempAlta && destaqueTempAltaCheckbox && tempMaxNum > parseFloat(destaqueTempAltaCheckbox.dataset.tempLimite)) classes += " destaque-temp-alta";
            html += `<div class="${classes}" data-dia-index="${index}"><h4>${dia.dataFormatada}</h4><img src="https://openweathermap.org/img/wn/${dia.iconeGeral}@2x.png" title="${dia.descricaoGeral}"><p class="temp-range"><span class="temp-max">${dia.temp_max.toFixed(0)}°C</span> / <span class="temp-min">${dia.temp_min.toFixed(0)}°C</span></p><p class="description">${dia.descricaoGeral}</p><div class="detalhes-horarios" style="display: none;"></div></div>`;
        });
        html += '</div>';
        resultadoDiv.innerHTML = html;
        _renderFeatherIcons();
        adicionarListenersCardsPrevisao(diasParaExibir);
    }

    function adicionarListenersCardsPrevisao(diasExibidos) {
        const resultadoDiv = weatherResultDivViagem || document.getElementById('previsao-tempo-resultado');
        if (!resultadoDiv) return;
        resultadoDiv.querySelectorAll('.forecast-day-card').forEach(card => {
            card.addEventListener('click', () => {
                const detalhesDiv = card.querySelector('.detalhes-horarios');
                if(!detalhesDiv) return;
                const diaIndex = parseInt(card.dataset.diaIndex);
                if (!diasExibidos || diaIndex < 0 || diaIndex >= diasExibidos.length) return;
                const dadosDia = diasExibidos[diaIndex];
                if (!dadosDia || !dadosDia.previsoesHorarias) { detalhesDiv.innerHTML = "<p>Detalhes indisponíveis.</p>"; detalhesDiv.style.display = 'block'; return; }
                if (detalhesDiv.style.display === 'none' || detalhesDiv.innerHTML.trim() === '') {
                    let html = '';
                    dadosDia.previsoesHorarias.forEach(ph => { html += `<p><span class="hora-item">${ph.hora}</span> <img src="https://openweathermap.org/img/wn/${ph.icone}.png" title="${ph.descricao}"> <span class="desc-item">${ph.descricao}</span> <span class="temp-item">${ph.temp}°C</span></p>`; });
                    detalhesDiv.innerHTML = html || "<p>Sem detalhes.</p>"; detalhesDiv.style.display = 'block';
                } else {
                    detalhesDiv.style.display = 'none';
                    detalhesDiv.innerHTML = ''; 
                }
            });
        });
    }

    if (searchButtonViagem) {
        searchButtonViagem.addEventListener('click', async () => {
            const city = cityInputViagem ? cityInputViagem.value.trim() : null;
            const dadosApi = await fetchWeatherFromBackend(city, 'forecast');
            if (dadosApi) {
                dadosCompletosForecastCache = processarDadosForecast(dadosApi);
                cidadeCache = dadosApi.city?.name || city;
                if (dadosCompletosForecastCache) {
                    exibirPrevisaoDetalhadaUI(dadosCompletosForecastCache, cidadeCache);
                } else if (weatherResultDivViagem) {
                    weatherResultDivViagem.innerHTML = `<p class="placeholder">Erro ao processar previsão.</p>`;
                }
            }
        });
    }
    if (cityInputViagem) cityInputViagem.addEventListener('keypress', (e) => { if (e.key === 'Enter' && searchButtonViagem) searchButtonViagem.click(); });
    if (filtroDiasButtons) filtroDiasButtons.forEach(b => b.addEventListener('click', () => {
        filtroDiasAtivo = parseInt(b.dataset.dias);
        filtroDiasButtons.forEach(btn => btn.classList.remove('active')); b.classList.add('active');
        if (dadosCompletosForecastCache) exibirPrevisaoDetalhadaUI(dadosCompletosForecastCache, cidadeCache);
    }));
    if (destaqueChuvaCheckbox) destaqueChuvaCheckbox.addEventListener('change', () => {
        destacarChuva = destaqueChuvaCheckbox.checked;
        if (dadosCompletosForecastCache) exibirPrevisaoDetalhadaUI(dadosCompletosForecastCache, cidadeCache);
    });
    if (destaqueTempBaixaCheckbox) destaqueTempBaixaCheckbox.addEventListener('change', () => {
        destacarTempBaixa = destaqueTempBaixaCheckbox.checked;
        if (dadosCompletosForecastCache) exibirPrevisaoDetalhadaUI(dadosCompletosForecastCache, cidadeCache);
    });
    if (destaqueTempAltaCheckbox) destaqueTempAltaCheckbox.addEventListener('change', () => {
        destacarTempAlta = destaqueTempAltaCheckbox.checked;
        if (dadosCompletosForecastCache) exibirPrevisaoDetalhadaUI(dadosCompletosForecastCache, cidadeCache);
    });

    // --- Funções para buscar dados do Backend ---
    async function carregarVeiculosDoBackend() {
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos`);
            if (!response.ok) throw new Error('Falha ao buscar veículos do servidor.');
            const veiculosDoDb = await response.json();
            garagem.veiculos = []; 
            veiculosDoDb.forEach(jsonVeiculo => {
                try {
                    const veiculo = Veiculo.fromJSON(jsonVeiculo); 
                    garagem.adicionarVeiculo(veiculo);
                } catch (e) {
                    console.error("Erro ao processar veículo do DB:", jsonVeiculo, e);
                }
            });
            renderizarTudoUI(); 
            exibirNotificacao("Garagem sincronizada com o banco de dados.", 'info');
        } catch (error) {
            console.error("Erro ao carregar veículos do backend:", error);
            exibirNotificacao(error.message, 'erro');
        }
    }

    async function carregarVeiculosDestaque() {
        if (!cardsVeiculosDestaqueDiv) return;
        cardsVeiculosDestaqueDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando destaques...</p>`;
        _renderFeatherIcons();
        try {
            const response = await fetch(`${backendBaseUrl}/api/garagem/veiculos-destaque`);
            if (!response.ok) throw new Error('Falha ao carregar veículos em destaque.');
            const veiculos = await response.json();
            cardsVeiculosDestaqueDiv.innerHTML = '';
            if (!veiculos || veiculos.length === 0) { 
                cardsVeiculosDestaqueDiv.innerHTML = '<p class="placeholder">Nenhum veículo em destaque no momento.</p>'; 
                return; 
            }
            veiculos.forEach(v => {
                const card = document.createElement('div'); 
                card.className = 'veiculo-destaque-card';
                card.innerHTML = `
                    <img src="${v.imagemUrl || 'images/placeholder_car.png'}" alt="${v.modelo}">
                    <h4>${v.modelo}</h4>
                    <p class="ano-destaque">Ano: ${v.ano}</p>
                    <p class="texto-destaque">${v.destaque}</p>
                `;
                cardsVeiculosDestaqueDiv.appendChild(card);
            });
        } catch (e) { 
            console.error(e); 
            cardsVeiculosDestaqueDiv.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> ${e.message}</p>`; 
            _renderFeatherIcons(); 
        }
    }

    async function carregarServicosGaragem() {
        if (!listaServicosOferecidosUl) return;
        listaServicosOferecidosUl.innerHTML = `<li class="placeholder"><i data-feather="loader" class="spin"></i> Carregando serviços...</li>`; 
        _renderFeatherIcons();
        try {
            const response = await fetch(`${backendBaseUrl}/api/garagem/servicos-oferecidos`);
            if (!response.ok) throw new Error('Falha ao carregar serviços oferecidos.');
            const servicos = await response.json();
            listaServicosOferecidosUl.innerHTML = '';
            if (!servicos || servicos.length === 0) { 
                listaServicosOferecidosUl.innerHTML = '<li class="placeholder">Nenhum serviço cadastrado.</li>'; 
                return; 
            }
            servicos.forEach(s => {
                const item = document.createElement('li');
                item.innerHTML = `<strong>${s.nome}</strong>: ${s.descricao}${s.precoEstimado ? `<span class="preco-servico">A partir de: ${s.precoEstimado}</span>` : ''}`;
                listaServicosOferecidosUl.appendChild(item);
            });
        } catch (e) { 
            console.error(e); 
            listaServicosOferecidosUl.innerHTML = `<li class="placeholder erro"><i data-feather="alert-triangle"></i> ${e.message}</li>`; 
            _renderFeatherIcons(); 
        }
    }

    async function carregarTodasAsDicasDoBackend() {
        if (!dicasManutencaoViewDiv) return;
        dicasManutencaoViewDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando dicas de manutenção...</p>`; 
        _renderFeatherIcons();
        try {
            const response = await fetch(`${backendBaseUrl}/api/garagem/dicas-manutencao`);
            if (!response.ok) throw new Error('Falha ao carregar as dicas de manutenção.');
            todasAsDicasCache = await response.json();
            renderizarDicasFiltradas(); 
        } catch (error) {
            console.error("Erro ao buscar Dicas:", error);
            todasAsDicasCache = [];
            dicasManutencaoViewDiv.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> ${error.message}</p>`;
            _renderFeatherIcons();
        }
    }

    function renderizarDicasFiltradas() {
        if (!dicasManutencaoViewDiv || !filtroTipoVeiculoDicaSelect) return;
        const tipoSelecionado = filtroTipoVeiculoDicaSelect.value;
        dicasManutencaoViewDiv.innerHTML = ''; 
        
        if (todasAsDicasCache.length === 0 ) { 
            dicasManutencaoViewDiv.innerHTML = '<p class="placeholder">Nenhuma dica foi carregada.</p>'; 
            return;
        }

        const dicasFiltradas = todasAsDicasCache.filter(dica => 
            tipoSelecionado === "geral" || (dica.tipoAplicavel && dica.tipoAplicavel.includes(tipoSelecionado))
        );

        if (dicasFiltradas.length === 0) {
            dicasManutencaoViewDiv.innerHTML = `<p class="placeholder">Nenhuma dica encontrada para o tipo "${tipoSelecionado}".</p>`; 
            return;
        }

        const ul = document.createElement('ul'); 
        ul.className = 'lista-bonita'; 
        dicasFiltradas.forEach(dica => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${dica.titulo}:</strong> ${dica.dica}`;
            ul.appendChild(li);
        });
        dicasManutencaoViewDiv.appendChild(ul);
    }

    if (filtroTipoVeiculoDicaSelect) {
        filtroTipoVeiculoDicaSelect.addEventListener('change', renderizarDicasFiltradas);
    }

    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    function inicializarApp() {
        carregarVeiculosDoBackend();
        carregarVeiculosDestaque();
        carregarServicosGaragem();
        carregarTodasAsDicasDoBackend();
        if(tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change')); 
        if(controlesPrevisaoDiv) controlesPrevisaoDiv.style.display = 'none'; 
        if (navButtons.length > 0 && !document.querySelector('.nav-button.active')) navButtons[0].click();
        _renderFeatherIcons();
        console.log("Aplicação da Garagem inicializada com sucesso, conectada ao backend.");
    }

    inicializarApp();

}); // Fim do listener 'DOMContentLoaded'