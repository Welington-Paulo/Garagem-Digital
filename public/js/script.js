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
    
    const modalAgendamento = document.getElementById('modal-agendamento');
    const formAgendarManutencao = document.getElementById('form-agendar-manutencao');
    const agendamentoPlacaVeiculoInput = document.getElementById('agendamento-placa-veiculo');
    const modalVeiculoPlacaSpan = document.getElementById('modal-veiculo-placa');
    
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

    let filtroDiasAtivo = 5;
    let destacarChuva = false;
    let destacarTempBaixa = false;
    let destacarTempAlta = false;
    let dadosCompletosForecastCache = null;
    let cidadeCache = "";
    let todasAsDicasCache = [];

    const backendBaseUrl = 'http://localhost:3001'; // Porta do seu backend server.js

    function _renderFeatherIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace({ width: '1em', height: '1em', class: 'feather-icon-inline' });
        } else {
            // console.warn("Feather Icons não está definido. Ícones não serão renderizados via JS.");
        }
    }

    // --- Lógica do Menu Hambúrguer ---
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

    // --- Gerenciamento de Abas ---
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

    // --- Sistema de Notificação (Toast) ---
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

    // --- API Simulada de Detalhes Veiculares ---
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

    // --- Renderização e Atualização da UI (Funções da Garagem) ---
    function renderizarTudoUI() {
        if(typeof renderizarCardsVeiculosUI === 'function') renderizarCardsVeiculosUI();
        if(typeof atualizarPainelInteracaoUI === 'function') atualizarPainelInteracaoUI(); 
        if(typeof renderizarAgendamentosFuturosView === 'function') renderizarAgendamentosFuturosView();
        if(typeof renderizarLembretesManutencaoView === 'function') renderizarLembretesManutencaoView();
        if(typeof renderizarHistoricosConsolidadosView === 'function') renderizarHistoricosConsolidadosView();
        if(typeof preencherSelectVeiculosViagem === 'function') preencherSelectVeiculosViagem();
    }

    function renderizarCardsVeiculosUI() {
        if (!garagemDisplayCards) { console.warn("#garagem-display-cards não encontrado."); return; }
        garagemDisplayCards.innerHTML = garagem.listarVeiculosParaCards(); // Este método DEVE existir na classe Garagem
        document.querySelectorAll('.btn-card-selecionar').forEach(button => {
            button.addEventListener('click', (e) => {
                const placa = e.target.dataset.placa;
                if (garagem.selecionarVeiculoPorPlaca(placa)) { // Este método DEVE existir
                    if(typeof atualizarPainelInteracaoUI === 'function') atualizarPainelInteracaoUI(); 
                    renderizarCardsVeiculosUI(); // Re-renderiza para destacar o selecionado, se houver
                }
            });
        });
        _renderFeatherIcons();
    }
    
    async function atualizarPainelInteracaoUI() {
        const veiculo = garagem.getVeiculoSelecionado(); // Este método DEVE existir
        if (!nomeVeiculoInteracaoSpan || !divInfoVeiculoSelecionado) {
            // console.warn("Elementos do painel de interação não encontrados."); 
            return;
        }
            
        if (veiculo) {
            nomeVeiculoInteracaoSpan.textContent = `${veiculo.constructor.name} ${veiculo.modelo} (${veiculo.placa})`;
            // Assegure que veiculo.exibirInformacoes() e veiculo.atualizarDetalhesDaApi() existem e funcionam
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
                garagem.salvarNoLocalStorage(); 
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
        } else {
            nomeVeiculoInteracaoSpan.textContent = "Nenhum";
            divInfoVeiculoSelecionado.innerHTML = "<p>Selecione um veículo na aba \"Minha Garagem\" para interagir.</p>";
            if(divBotoesAcoesComuns) divBotoesAcoesComuns.style.display = 'none';
            if(divBotoesAcoesEspecificas) divBotoesAcoesEspecificas.style.display = 'none';
        }
        if(typeof window.atualizarLogInteracoesUI === 'function') window.atualizarLogInteracoesUI();
        _renderFeatherIcons();
    }

    window.atualizarLogInteracoesUI = function() { 
        if (!ulLogInteracoes) return;
        ulLogInteracoes.innerHTML = garagem.getHistoricoInteracoesFormatado(); // Este método DEVE existir
    }

    function renderizarAgendamentosFuturosView() { 
        if (!agendamentosFuturosViewDiv) return;
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        let html = '<ul>'; let encontrou = false;
        garagem.veiculos.forEach(v => {
            (v.historicoManutencao || []).forEach(m => {
                if (new Date(m.data + 'T00:00:00') >= hoje) { // Adiciona T00:00:00 para evitar problemas de fuso
                    html += `<li><strong>${v.placa} (${v.modelo}):</strong> ${m.formatarManutencao()}</li>`;
                    encontrou = true;
                }
            });
        });
        html += '</ul>';
        agendamentosFuturosViewDiv.innerHTML = encontrou ? html : '<p>Nenhum agendamento futuro.</p>';
    }

    function renderizarLembretesManutencaoView() { 
        if (!lembretesManutencaoViewDiv) return;
        const hoje = new Date(); const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
        hoje.setHours(0,0,0,0); amanha.setHours(0,0,0,0);
        let html = '<ul>'; let encontrou = false;
        garagem.veiculos.forEach(v => {
            (v.historicoManutencao || []).forEach(m => {
                const dataM = new Date(m.data + 'T00:00:00');
                if (dataM.getTime() === amanha.getTime()) {
                    html += `<li class="amanha">AMANHÃ: ${m.tipo} para <strong>${v.placa} (${v.modelo})</strong>.</li>`;
                    encontrou = true;
                } else if (dataM.getTime() === hoje.getTime()) {
                    html += `<li class="hoje">HOJE: ${m.tipo} para <strong>${v.placa} (${v.modelo})</strong>.</li>`;
                    encontrou = true;
                }
            });
        });
        html += '</ul>';
        lembretesManutencaoViewDiv.innerHTML = encontrou ? html : '<p>Nenhum lembrete para hoje ou amanhã.</p>';
        verificarAlertasPopupLembretes();
     }

    function renderizarHistoricosConsolidadosView() { 
        if (!historicosConsolidadosViewDiv) return;
        let html = ''; let encontrouHistoricoGeral = false;
        if (garagem.veiculos.length === 0) {
            historicosConsolidadosViewDiv.innerHTML = '<p>Nenhum veículo para exibir históricos.</p>'; return;
        }
        [...garagem.veiculos].sort((a,b) => a.placa.localeCompare(b.placa)).forEach(veiculo => {
            // Assegure que veiculo.formatarHistoricoManutencao() existe
            if (veiculo.historicoManutencao && veiculo.historicoManutencao.length > 0 && typeof veiculo.formatarHistoricoManutencao === 'function') {
                encontrouHistoricoGeral = true;
                html += `<div class="historico-consolidado-veiculo"><h4>Histórico de ${veiculo.constructor.name} ${veiculo.modelo} (Placa: ${veiculo.placa})</h4><ul>${veiculo.formatarHistoricoManutencao()}</ul></div>`;
            }
        });
        historicosConsolidadosViewDiv.innerHTML = encontrouHistoricoGeral ? html : '<p>Nenhum veículo possui histórico de manutenção.</p>';
    }

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

    // --- Lógica de Adicionar Veículo ---
    if (tipoVeiculoSelect) tipoVeiculoSelect.addEventListener('change', () => { 
        if (!camposEspecificosDivs) return;
        camposEspecificosDivs.forEach(div => div.style.display = 'none');
        const valorSelecionado = tipoVeiculoSelect.value.toLowerCase();
        if (valorSelecionado) { // Evita erro se valor for ""
            const divToShow = document.getElementById(`campos-${valorSelecionado}`);
            if (divToShow) divToShow.style.display = 'block';
        }
    });

if (formAddVeiculo) { 
    const submitButton = formAddVeiculo.querySelector('button[type="submit"]');

    formAddVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Log para depuração. Veja isso no console do navegador (F12).
        console.log('Manipulador de envio de formulário acionado. O estado de isSubmitting é:', isSubmitting);

        // Se já estivermos no processo de envio, interrompa imediatamente esta nova tentativa.
        if (isSubmitting) {
            console.log('Envio duplicado detectado e bloqueado.');
            return;
        }

        // Ativa a trava para bloquear envios subsequentes.
        isSubmitting = true; 
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
        
        // Validação no lado do cliente
        if (!dadosVeiculo.tipoVeiculo || !dadosVeiculo.marca || !dadosVeiculo.modelo || !dadosVeiculo.ano || !dadosVeiculo.placa) {
            exibirNotificacao("Por favor, preencha todos os campos obrigatórios.", 'erro');
            // IMPORTANTE: Libere a trava se a validação falhar.
            isSubmitting = false; 
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
                _renderFeatherIcons();
            }
            return;
        }

        // Preenchimento dos detalhes específicos
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
            if (!response.ok) {
                // Lança o erro que vem do backend (ex: "Veículo com a placa ... já existe.")
                throw new Error(resultado.error);
            }

            exibirNotificacao(`Veículo ${resultado.modelo} adicionado com sucesso!`, 'sucesso');
            formAddVeiculo.reset();
            const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
            if(tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change'));
            
            await carregarVeiculosDoBackend(); 

        } catch (error) {
            // Este catch agora só vai capturar erros reais ou a mensagem de placa duplicada
            // que o backend envia na segunda requisição (que agora está bloqueada).
            exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, 'erro');
            console.error("Erro no POST do veículo:", error);
        } finally {
            // Este bloco SEMPRE será executado, liberando a trava para um novo envio futuro.
            console.log('Processo de envio finalizado. Liberando a trava.');
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
                _renderFeatherIcons();
            }
        }
    });
}

    // --- Lógica de Interação com Veículo Selecionado ---
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
            
            const resultado = garagem.interagirComSelecionado(acao, valor); 
            if (resultado && typeof resultado.mensagem === 'string') { 
                exibirNotificacao(resultado.mensagem, resultado.sucesso === false ? 'aviso' : 'info');
            }
            atualizarPainelInteracaoUI(); 
            renderizarCardsVeiculosUI(); 
            garagem.salvarNoLocalStorage(); 
        });
    });

    // --- Lógica de Agendamento de Manutenção (Modal) ---
    window.abrirModalAgendamento = (placa) => { 
        const veiculo = garagem.encontrarVeiculo(placa);
        if (veiculo && modalAgendamento && agendamentoPlacaVeiculoInput && modalVeiculoPlacaSpan && formAgendarManutencao) {
            agendamentoPlacaVeiculoInput.value = placa;
            modalVeiculoPlacaSpan.textContent = `${veiculo.constructor.name} ${veiculo.modelo} (${placa})`;
            formAgendarManutencao.reset();
            const hojeISO = new Date().toISOString().split('T')[0];
            const dataInput = document.getElementById('agendamento-data');
            if(dataInput) { dataInput.min = hojeISO; dataInput.value = hojeISO; }
            modalAgendamento.style.display = 'block';
        } else exibirNotificacao("Veículo não encontrado ou elementos do modal de agendamento faltando.", 'erro');
    };
    window.fecharModalAgendamento = () => { if(modalAgendamento) modalAgendamento.style.display = 'none'; };
    window.addEventListener('click', (event) => { if (modalAgendamento && event.target == modalAgendamento) fecharModalAgendamento(); });
    
    if(formAgendarManutencao) formAgendarManutencao.addEventListener('submit', (e) => { 
        e.preventDefault();
        const fd = new FormData(formAgendarManutencao);
        const placa = fd.get('placa-veiculo'); 
        const data = fd.get('data'); 
        const hora = fd.get('agendamento-hora');
        const tipoServico = fd.get('tipo')?.trim(); 
        const custo = parseFloat(fd.get('custo')); 
        const desc = fd.get('descricao')?.trim();

        if (!data || !tipoServico || isNaN(custo) || custo < 0) { exibirNotificacao("Preencha Data, Tipo de Serviço e Custo (deve ser um valor positivo).", 'erro'); return; }
        const veiculo = garagem.encontrarVeiculo(placa);
        if (veiculo) {
            try {
                const manut = new Manutencao(data, tipoServico, custo, `${desc}${hora ? ` agendado para as ${hora}` : ''}`.trim());
                veiculo.adicionarManutencao(manut);
                garagem.salvarNoLocalStorage(); 
                renderizarTudoUI(); 
                fecharModalAgendamento(); 
                exibirNotificacao(`Manutenção '${tipoServico}' agendada para ${placa}!`, 'sucesso');
            } catch (error) { exibirNotificacao(`Erro ao agendar manutenção: ${error.message}`, 'erro'); }
        }
    });

    // Funções no escopo global para onclicks do HTML (se houver)
    window.exibirHistorico = (placa) => { 
        const divHist = document.getElementById(`historico-${placa}`);
        if (divHist) divHist.style.display = divHist.style.display === 'none' ? 'block' : 'none';
    };
    window.confirmarRemocaoVeiculo = (placa, modeloInfo) => { 
        if (confirm(`Tem certeza que deseja remover ${modeloInfo} (Placa: ${placa})? Esta ação não pode ser desfeita.`)) {
            if (garagem.removerVeiculo(placa)) {
                garagem.salvarNoLocalStorage(); 
                renderizarTudoUI(); 
                exibirNotificacao(`${modeloInfo} (placa ${placa}) removido da garagem.`, 'sucesso');
            } else exibirNotificacao(`Erro ao tentar remover ${modeloInfo}.`, 'erro');
        }
    };
    
    // --- Lógica do Planejador de Viagem (CHAMANDO O BACKEND) ---
    async function fetchWeatherFromBackend(city, type = 'forecast') {
        if (!cityInputViagem || !weatherResultDivViagem || !searchButtonViagem || !errorMessageDivViagem) {
            console.error("Elementos do DOM do planejador de viagem não encontrados."); return null;
        }
        if (!city) {
            errorMessageDivViagem.textContent = 'Por favor, digite o nome de uma cidade.';
            errorMessageDivViagem.style.display = 'block';
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
    
    // Event Listener para o botão "Verificar Clima"
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

    // Listeners para filtros e destaques da previsão
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

    // --- FUNÇÕES PARA BUSCAR E EXIBIR DADOS DO "ARSENAL DO BACKEND" ---

/**
 * Carrega e exibe os veículos em destaque de um endpoint do backend.
 */
// NOVA FUNÇÃO para buscar veículos do backend
async function carregarVeiculosDoBackend() {
    try {
        const response = await fetch(`${backendBaseUrl}/api/veiculos`);
        if (!response.ok) {
            throw new Error('Falha ao buscar veículos do servidor.');
        }
        const veiculosDoDb = await response.json();
        
        // Limpa a garagem atual e adiciona os veículos do banco de dados
        garagem.veiculos = []; 
        veiculosDoDb.forEach(jsonVeiculo => {
            try {
                // Usa a desserialização que você já tem no Veiculo.js do frontend
                const veiculo = Veiculo.fromJSON(jsonVeiculo); 
                garagem.adicionarVeiculo(veiculo);
            } catch (e) {
                console.error("Erro ao processar veículo do DB:", jsonVeiculo, e);
            }
        });

        renderizarTudoUI(); // Atualiza toda a interface com os novos dados
        exibirNotificacao("Garagem sincronizada com o banco de dados.", 'info');

    } catch (error) {
        console.error("Erro ao carregar veículos do backend:", error);
        exibirNotificacao(error.message, 'erro');
    }
}

// ...

// MODIFIQUE o listener do formulário 'formAddVeiculo'
// Adicione esta variável de controle no escopo do DOMContentLoaded, antes do listener
let isSubmitting = false;

if (formAddVeiculo) { 
    const submitButton = formAddVeiculo.querySelector('button[type="submit"]');

    formAddVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ---- INÍCIO DA SOLUÇÃO ----
        // Se já estiver enviando, não faça nada.
        if (isSubmitting) {
            return;
        }
        // Ativa a "trava" e atualiza a UI do botão
        isSubmitting = true; 
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i data-feather="loader" class="spin"></i> Salvando...';
            _renderFeatherIcons();
        }
        // ---- FIM DA SOLUÇÃO ----

        const fd = new FormData(formAddVeiculo);
        // ... (o resto da sua lógica de pegar os dados do formulário permanece igual)
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
            // Libera a trava em caso de erro de validação
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
            if (!response.ok) throw new Error(resultado.error || `Erro ${response.status}`);

            exibirNotificacao(`Veículo ${resultado.modelo} adicionado com sucesso!`, 'sucesso');
            formAddVeiculo.reset();
            const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
            if(tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change'));
            
            await carregarVeiculosDoBackend(); 

        } catch (error) {
            exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, 'erro');
            console.error("Erro no POST do veículo:", error);
        } finally {
            // ---- INÍCIO DA SOLUÇÃO ----
            // Libera a trava e restaura o botão, não importa o que aconteceu.
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
                _renderFeatherIcons();
            }
            // ---- FIM DA SOLUÇÃO ----
        }
    });
}

// MODIFIQUE a função de remoção
window.confirmarRemocaoVeiculo = async (placa, modeloInfo) => { 
    if (confirm(`Tem certeza que deseja remover ${modeloInfo} (Placa: ${placa})? Esta ação não pode ser desfeita.`)) {
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${placa}`, {
                method: 'DELETE',
            });
            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.error || 'Erro ao remover veículo.');
            }
            exibirNotificacao(resultado.message, 'sucesso');
            await carregarVeiculosDoBackend(); // Atualiza a lista da garagem
        } catch (error) {
            exibirNotificacao(error.message, 'erro');
        }
    }
};


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

/**
 * Carrega e exibe a lista de serviços oferecidos pela garagem.
 */
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

/**
 * Carrega todas as dicas de manutenção do backend e as armazena em cache.
 */
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

/**
 * Renderiza as dicas na UI com base no filtro selecionado.
 */
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

// Adiciona o listener para o filtro de dicas
if (filtroTipoVeiculoDicaSelect) {
    filtroTipoVeiculoDicaSelect.addEventListener('change', renderizarDicasFiltradas);
}


/**
 * Verifica se há lembretes de manutenção e exibe pop-ups se necessário.
 * A lógica específica para pop-ups deve ser implementada aqui.
 */
function verificarAlertasPopupLembretes() {
    // Esta função foi mantida como um espaço reservado.
    // Você pode adicionar aqui a lógica para exibir notificações mais proeminentes
    // (modais, pop-ups, etc.) para manutenções agendadas para hoje ou amanhã,
    // usando os dados já carregados na `garagem.veiculos`.
    // Exemplo:
    /*
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    garagem.veiculos.forEach(v => {
        (v.historicoManutencao || []).forEach(m => {
            const dataM = new Date(m.data);
            if (dataM.getTime() === hoje.getTime()) {
                // alert(`LEMBRETE: ${m.tipo} para o veículo ${v.placa} é hoje!`);
            }
        });
    });
    */
}


// --- INICIALIZAÇÃO DA APLICAÇÃO ---

/**
 * Função principal que inicializa todos os componentes da aplicação.
 */
function inicializarApp() {
    // 1. Carrega os dados principais da aplicação a partir do backend.
    carregarVeiculosDoBackend();
    
    // ... o resto da função permanece o mesmo
    carregarVeiculosDestaque();
    carregarServicosGaragem();
    carregarTodasAsDicasDoBackend();

    // 3. Define o estado inicial de alguns elementos da UI.
    if(tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change')); // Garante que os campos específicos fiquem ocultos
    if(controlesPrevisaoDiv) controlesPrevisaoDiv.style.display = 'none'; // Esconde os controles de previsão do tempo
    
    // 4. Ativa a primeira aba do menu por padrão para garantir que uma tela seja exibida.
    if (navButtons.length > 0 && !document.querySelector('.nav-button.active')) {
        navButtons[0].click();
    }
    
    // 5. Renderiza todos os ícones Feather que podem ter sido adicionados dinamicamente.
    _renderFeatherIcons();
    
    console.log("Aplicação da Garagem inicializada com sucesso, conectada ao backend.");
}

// Inicia a aplicação quando o DOM estiver completamente carregado.
inicializarApp();

}); // Fim do listener 'DOMContentLoaded'