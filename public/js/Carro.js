// public/js/Carro.js

class Carro extends Veiculo {
    // O construtor agora recebe o objeto JSON completo
    constructor(jsonData) {
        // A chamada 'super()' repassa todo o objeto de dados para a classe mãe (Veiculo)
        // O Veiculo.constructor irá extrair id, placa, marca, etc., para nós.
        super(jsonData);

        // Define as propriedades específicas do Carro, pegando do sub-objeto 'detalhes'
        // Se 'detalhes' ou 'numeroPortas' não existirem, usa 4 como padrão.
        this.numeroPortas = jsonData.detalhes?.numeroPortas || 4;
    }

    // Sobrescreve o método da classe mãe para adicionar informações específicas do Carro
    exibirInformacoes() {
        // Chama o método original da classe Veiculo para obter o HTML com as informações básicas
        const infoBase = super.exibirInformacoes();
        
        // Adiciona a informação específica do número de portas ao final do HTML
        return `
            ${infoBase}
            <p><strong>Nº de Portas:</strong> ${this.numeroPortas}</p>
        `;
    }
}