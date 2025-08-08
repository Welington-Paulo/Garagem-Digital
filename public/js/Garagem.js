// JS/Garagem.js

class Garagem {
    constructor() {
        this.veiculos = [];
        this.veiculoSelecionado = null; 
        this.historicoInteracoes = []; 
    }

    /**
     * Adiciona um veículo ao array local da garagem.
     * @param {Veiculo} veiculo A instância do veículo a ser adicionada.
     * @returns {boolean} True se foi adicionado, false caso contrário.
     */
    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Garagem.adicionarVeiculo: Tentativa de adicionar objeto que não é Veiculo.");
            return false;
        }
        // A verificação de duplicidade de placa agora é primariamente feita no backend,
        // mas manter aqui evita erros visuais antes de recarregar.
        if (this.veiculos.find(v => v.placa.toUpperCase() === veiculo.placa.toUpperCase())) {
            // Não é mais um erro crítico, apenas um estado transitório da UI
            return false; 
        }
        this.veiculos.push(veiculo);
        
        // Auto-seleciona o primeiro veículo adicionado
        if (!this.veiculoSelecionado || this.veiculos.length === 1) {
            this.selecionarVeiculoPorReferencia(veiculo);
        }
        return true;
    }
    
    /**
     * Seleciona um veículo na garagem pela sua instância.
     * @param {Veiculo} veiculo A instância do veículo a ser selecionada.
     * @returns {boolean} True se a seleção foi bem-sucedida.
     */
    selecionarVeiculoPorReferencia(veiculo) {
        if (veiculo instanceof Veiculo && this.veiculos.includes(veiculo)) {
            if (this.veiculoSelecionado !== veiculo) { 
                this.veiculoSelecionado = veiculo;
                this.registrarInteracao(`Veículo "${veiculo.modelo}" selecionado para interação.`);
            }
            return true;
        }
        return false;
    }
    
    /**
     * Seleciona um veículo na garagem pela sua placa.
     * @param {string} placa A placa do veículo a ser selecionado.
     * @returns {boolean} True se a seleção foi bem-sucedida.
     */
    selecionarVeiculoPorPlaca(placa) {
        const veiculoEncontrado = this.encontrarVeiculo(placa);
        if (veiculoEncontrado) {
            return this.selecionarVeiculoPorReferencia(veiculoEncontrado);
        }
        this.registrarInteracao(`Tentativa de selecionar veículo com placa "${placa}" não encontrado.`, "aviso");
        return false;
    }

    getVeiculoSelecionado() {
        return this.veiculoSelecionado;
    }

    /**
     * Executa uma ação no veículo atualmente selecionado.
     * @param {string} acao A ação a ser executada (ex: "ligar", "acelerar").
     * @param {*} valor O valor associado à ação (ex: peso para carregar).
     * @returns {string} O resultado da interação.
     */
    interagirComSelecionado(acao, valor) {
        if (!this.veiculoSelecionado) {
            const msg = "Nenhum veículo selecionado para interagir.";
            this.registrarInteracao(msg, "aviso");
            return msg;
        }

        let resultado = `Ação "${acao}" não reconhecida ou não aplicável para ${this.veiculoSelecionado.modelo}.`;
        let tipoLog = "aviso";

        try {
            switch (acao) {
                case "ligar": resultado = this.veiculoSelecionado.ligar(); tipoLog = "info"; break;
                case "desligar": resultado = this.veiculoSelecionado.desligar(); tipoLog = "info"; break;
                case "acelerar": resultado = this.veiculoSelecionado.acelerar(valor ? parseInt(valor) : undefined); tipoLog = "info"; break;
                case "frear": resultado = this.veiculoSelecionado.frear(valor ? parseInt(valor) : undefined); tipoLog = "info"; break;
                case "buzinar": resultado = this.veiculoSelecionado.buzinar(); tipoLog = "info"; break;
                case "ativarTurbo":
                    if (this.veiculoSelecionado instanceof CarroEsportivo) { resultado = this.veiculoSelecionado.ativarTurbo(); tipoLog = "info";}
                    break;
                case "desativarTurbo":
                    if (this.veiculoSelecionado instanceof CarroEsportivo) { resultado = this.veiculoSelecionado.desativarTurbo(); tipoLog = "info";}
                    break;
                case "carregar":
                    if (this.veiculoSelecionado instanceof Caminhao) { resultado = this.veiculoSelecionado.carregar(valor ? parseFloat(valor) : 0); tipoLog = "info";}
                    break;
                case "descarregar":
                    if (this.veiculoSelecionado instanceof Caminhao) { resultado = this.veiculoSelecionado.descarregar(valor ? parseFloat(valor) : 0); tipoLog = "info";}
                    break;
                default: tipoLog = "erro";
            }
        } catch (e) {
            resultado = `Erro ao executar "${acao}": ${e.message}`;
            tipoLog = "erro";
            console.error(resultado, e);
        }
        this.registrarInteracao(resultado, tipoLog);
        return resultado;
    }

    /**
     * Registra uma mensagem no histórico de interações da garagem.
     * @param {string} mensagem A mensagem a ser registrada.
     * @param {string} [tipo="info"] O tipo de log (info, aviso, erro).
     */
    registrarInteracao(mensagem, tipo = "info") {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.historicoInteracoes.unshift({ timestamp, mensagem, tipo });
        if (this.historicoInteracoes.length > 15) this.historicoInteracoes.pop();
        
        // Chama a função global para atualizar a UI
        if (typeof window.atualizarLogInteracoesUI === "function") {
            window.atualizarLogInteracoesUI();
        }
    }

    getHistoricoInteracoesFormatado() {
        if (this.historicoInteracoes.length === 0) {
            return '<li>Nenhuma interação registrada ainda.</li>';
        }
        return this.historicoInteracoes.map(item =>
            `<li class="log-${item.tipo}">[${item.timestamp}] ${item.mensagem}</li>`
        ).join('');
    }

    /**
     * **MÉTODO CRUCIAL ATUALIZADO**
     * Gera o HTML para os cards de todos os veículos na garagem, incluindo os botões de ação.
     * @returns {string} O HTML dos cards dos veículos.
     */
    listarVeiculosParaCards() {
        if (this.veiculos.length === 0) {
            return "<p>Sua garagem está vazia. Adicione um veículo na aba 'Adicionar Veículo'!</p>";
        }

        // Ordena os veículos pela placa para uma exibição consistente
        const veiculosOrdenados = [...this.veiculos].sort((a,b) => a.placa.localeCompare(b.placa));

        let listaHtml = veiculosOrdenados.map(veiculo => {
            const isSelecionado = this.veiculoSelecionado === veiculo;
            const detalhesCard = veiculo.exibirDetalhesCard ? veiculo.exibirDetalhesCard() : veiculo.exibirDetalhesBase();
            
            // O `veiculo.id` aqui é o `_id` do MongoDB, essencial para o CRUD.
            return `
                <li class="veiculo-card ${isSelecionado ? 'card-selecionado' : ''}" data-placa-veiculo="${veiculo.placa}">
                    <div class="card-header">
                        <strong>${veiculo.constructor.name} - ${veiculo.modelo}</strong>
                        <span>Placa: ${veiculo.placa}</span>
                    </div>
                    <p class="card-detalhes">${detalhesCard}</p>
                    <div class="botoes-veiculo-card">
                        <button class="btn-card-selecionar" data-placa="${veiculo.placa}">Interagir</button>
                        <button class="btn-card-agendar secondary" onclick="abrirModalAgendamento('${veiculo.placa}')">Agendar Man.</button>
                        
                        <!-- BOTÕES DE AÇÃO CRUD -->
                        <button class="btn-card-editar secondary" onclick="abrirModalEdicao('${veiculo.id}')">Editar</button>
                        <button class="btn-card-remover danger" onclick="confirmarRemocaoVeiculo('${veiculo.id}', '${veiculo.modelo} (${veiculo.constructor.name})')">Remover</button>
                    </div>
                    <div id="historico-${veiculo.placa}" class="historico-veiculo" style="display:none;">
                        <h4>Histórico de Manutenção:</h4>
                        <ul>${veiculo.formatarHistoricoManutencao()}</ul>
                    </div>
                </li>`;
        }).join('');

        return `<ul>${listaHtml}</ul>`;
    }

    /**
     * Encontra um veículo no array local pela sua placa.
     * @param {string} placa A placa a ser procurada.
     * @returns {Veiculo|undefined} O veículo encontrado ou undefined.
     */
    encontrarVeiculo(placa) {
        const placaUpperCase = placa.toUpperCase();
        return this.veiculos.find(v => v.placa.toUpperCase() === placaUpperCase);
    }
    
    /**
     * **NOVO**
     * Encontra um veículo no array local pelo seu ID do MongoDB.
     * @param {string} id O ID do MongoDB a ser procurado.
     * @returns {Veiculo|undefined} O veículo encontrado ou undefined.
     */
    encontrarVeiculoPorId(id) {
        return this.veiculos.find(v => v.id === id);
    }

    // Os métodos salvarNoLocalStorage e carregarDoLocalStorage foram removidos
    // pois a fonte da verdade agora é o banco de dados, e a sincronização é
    // feita pela função carregarVeiculosDoBackend() no script.js.
};