// public/js/Caminhao.js

class Caminhao extends Veiculo {
    // O construtor agora recebe o objeto JSON completo
    constructor(jsonData) {
        // A chamada 'super()' repassa todo o objeto de dados para a classe mãe (Veiculo)
        super(jsonData);
        
        // Define as propriedades específicas do Caminhão
        this.capacidadeCarga = jsonData.detalhes?.capacidadeCarga || 1000;
        this.cargaAtual = 0;
    }

    // Métodos específicos do Caminhão
    carregar(peso) {
        if (!this.ligado) {
            return "É preciso ligar o caminhão para operar a carga.";
        }
        
        const pesoNumerico = parseFloat(peso);
        if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
            return "O peso para carregar deve ser um número positivo.";
        }
        
        if (this.cargaAtual + pesoNumerico > this.capacidadeCarga) {
            return `Não é possível carregar ${pesoNumerico}kg. Excede a capacidade máxima de ${this.capacidadeCarga}kg. Carga atual: ${this.cargaAtual}kg.`;
        }
        
        this.cargaAtual += pesoNumerico;
        return `Carregando ${pesoNumerico}kg. Carga atual: ${this.cargaAtual}kg.`;
    }

    descarregar(peso) {
        if (!this.ligado) {
            return "É preciso ligar o caminhão para operar a carga.";
        }

        const pesoNumerico = parseFloat(peso);
        if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
            return "O peso para descarregar deve ser um número positivo.";
        }

        if (pesoNumerico > this.cargaAtual) {
            return `Não é possível descarregar ${pesoNumerico}kg. Carga atual é de apenas ${this.cargaAtual}kg.`;
        }
        
        this.cargaAtual -= pesoNumerico;
        return `Descarregando ${pesoNumerico}kg. Carga atual: ${this.cargaAtual}kg.`;
    }

    // Sobrescreve o método de informações para incluir os detalhes da carga
    exibirInformacoes() {
        // Pega as informações de Veiculo
        const infoBase = super.exibirInformacoes(); 
        
        // Adiciona as informações específicas do Caminhão
        return `
            ${infoBase}
            <p><strong>Capacidade de Carga:</strong> ${this.capacidadeCarga} kg</p>
            <p><strong>Carga Atual:</strong> ${this.cargaAtual} kg</p>
        `;
    }
}