// public/js/Garagem.js

class Garagem {
    constructor() {
        this.veiculos = [];          // Lista de veículos do usuário logado (próprios + compartilhados com permissão)
        this.veiculoSelecionado = null;
        this.historicoInteracoes = [];
    }

    /**
     * Define a lista principal de veículos da garagem do usuário.
     * @param {Array} veiculosData - Um array de objetos JSON de veículos vindos da API.
     */
    setVeiculos(veiculosData) {
        this.veiculos = veiculosData.map(v => Veiculo.fromJSON({ ...v, id: v._id }));
        // Se o veículo que estava selecionado não existe mais na nova lista (ex: foi removido), limpa a seleção.
        if (this.veiculoSelecionado && !this.veiculos.some(v => v.id === this.veiculoSelecionado.id)) {
            this.veiculoSelecionado = null;
        }
    }
    
    /**
     * Adiciona um único veículo à garagem após o cadastro.
     * @param {Veiculo} veiculo - A instância do veículo a ser adicionada.
     */
    adicionarVeiculo(veiculo) {
        // Garante que o objeto é uma instância de Veiculo e não um objeto JSON simples.
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar um objeto que não é uma instância de Veiculo.");
            return;
        }
        // Evita adicionar duplicatas.
        if (!this.veiculos.some(v => v.id === veiculo.id)) {
            this.veiculos.unshift(veiculo); // Adiciona no início da lista para aparecer primeiro.
        }
    }

    /**
     * Encontra uma instância de Veiculo na lista da garagem pelo seu ID.
     * @param {string} id - O ID do veículo a ser encontrado.
     * @returns {Veiculo|undefined} A instância do veículo ou undefined se não for encontrada.
     */
encontrarVeiculoPorId(id) {
    // Procura pelo ID mapeado OU pelo _id original da API
    return this.veiculos.find(v => v.id === id || v._id === id);
}
    
    /**
     * Define um veículo da PRÓPRIA garagem (ou compartilhada) como o selecionado.
     * @param {string} id - O ID do veículo a ser selecionado.
     * @returns {boolean} True se a seleção foi bem-sucedida.
     */
    selecionarVeiculoPorId(id) {
        const veiculoEncontrado = this.encontrarVeiculoPorId(id);
        if (veiculoEncontrado) {
            this.veiculoSelecionado = veiculoEncontrado;
            this.registrarInteracao(`Veículo "${veiculoEncontrado.modelo}" selecionado.`);
            return true;
        }
        return false;
    }
    
    /**
     * Carrega e seleciona temporariamente um veículo que não pertence à garagem do usuário (de amigos ou público).
     * @param {object} veiculoJson - O objeto JSON do veículo vindo da API.
     * @returns {boolean} True se a seleção foi bem-sucedida.
     */
    selecionarVeiculoExterno(veiculoJson) {
        try {
            // Cria uma instância temporária do veículo e a define como a selecionada.
            this.veiculoSelecionado = Veiculo.fromJSON({ ...veiculoJson, id: veiculoJson._id });
            this.registrarInteracao(`Visualizando veículo externo: "${this.veiculoSelecionado.modelo}".`);
            return true;
        } catch (error) {
            console.error("Erro ao instanciar veículo externo:", error);
            this.veiculoSelecionado = null;
            return false;
        }
    }

    /**
     * Retorna a instância do veículo atualmente selecionado.
     * @returns {Veiculo|null}
     */
    getVeiculoSelecionado() {
        return this.veiculoSelecionado;
    }

    /**
     * Executa uma ação (método) no veículo atualmente selecionado.
     * @param {string} acao - O nome do método a ser chamado (ex: 'ligar', 'acelerar').
     * @param {*} valor - Um valor opcional para passar para o método (ex: peso para carregar).
     */
    interagirComSelecionado(acao, valor) {
        if (!this.veiculoSelecionado) {
            this.registrarInteracao("Nenhum veículo selecionado para interagir.", "aviso");
            return;
        }

        let resultado;
        try {
            // Verifica se o método existe diretamente na instância do veículo antes de chamar.
            if (typeof this.veiculoSelecionado[acao] === 'function') {
                resultado = this.veiculoSelecionado[acao](valor);
                this.registrarInteracao(resultado, "info");
            } else {
                throw new Error(`Ação '${acao}' não é válida para este tipo de veículo.`);
            }
        } catch (e) {
            this.registrarInteracao(`Erro ao executar "${acao}": ${e.message}`, "erro");
        }
    }
    
    /**
     * Adiciona uma nova entrada ao log de interações.
     * @param {string} mensagem - A mensagem a ser registrada.
     * @param {string} tipo - O tipo de log ('info', 'erro', 'aviso').
     */
    registrarInteracao(mensagem, tipo = "info") {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.historicoInteracoes.unshift({ timestamp, mensagem, tipo });
        // Limita o histórico a 20 entradas para não sobrecarregar a memória.
        if (this.historicoInteracoes.length > 20) {
            this.historicoInteracoes.pop();
        }
    }

    /**
     * Retorna o histórico de interações formatado como uma lista HTML.
     * @returns {string} Uma string HTML com os itens do log.
     */
    getHistoricoInteracoesFormatado() {
        if (this.historicoInteracoes.length === 0) {
            return '<li>Nenhuma interação registrada.</li>';
        }
        return this.historicoInteracoes.map(item => 
            `<li class="log-${item.tipo}">[${item.timestamp}] ${item.mensagem}</li>`
        ).join('');
    }
}