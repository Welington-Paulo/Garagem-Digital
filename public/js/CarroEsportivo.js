// public/js/CarroEsportivo.js

class CarroEsportivo extends Carro {
    // O construtor agora recebe o objeto JSON completo
    constructor(jsonData) {
        // A chamada 'super()' repassa todo o objeto de dados para a classe mãe (Carro)
        // O Carro.constructor cuidará de chamar o construtor do Veiculo e definir o numeroPortas
        super(jsonData);
        
        // Define as propriedades específicas do CarroEsportivo
        this.velocidadeMaximaTurbo = jsonData.detalhes?.velocidadeMaximaTurbo || 250;
        this.turboLigado = false;
    }

    // Método específico do Carro Esportivo
    ativarTurbo() {
        if (this.ligado) {
            if (!this.turboLigado) {
                this.turboLigado = true;
                return `Turbo ativado! Prepare-se para a velocidade máxima de ${this.velocidadeMaximaTurbo} km/h!`;
            }
            return "O turbo já está ativado.";
        }
        return "Não é possível ativar o turbo com o carro desligado.";
    }

    desativarTurbo() {
        if (this.turboLigado) {
            this.turboLigado = false;
            return "Turbo desativado.";
        }
        return "O turbo já estava desativado.";
    }

    // Sobrescreve o método de acelerar para incluir a lógica do turbo
    acelerar() {
        if (this.ligado) {
            const incremento = this.turboLigado ? 20 : 10;
            this.velocidade += incremento;
            return `Acelerando o ${this.modelo} ${this.turboLigado ? 'com turbo' : ''}. Velocidade atual: ${this.velocidade} km/h.`;
        }
        return `Não é possível acelerar, o ${this.modelo} está desligado.`;
    }

    // Sobrescreve o método de informações para incluir os detalhes do turbo
    exibirInformacoes() {
        // Pega as informações de Veiculo e Carro
        const infoBase = super.exibirInformacoes(); 
        
        // Adiciona as informações específicas do CarroEsportivo
        return `
            ${infoBase}
            <p><strong>Vel. Máx. Turbo:</strong> ${this.velocidadeMaximaTurbo} km/h</p>
            <p><strong>Turbo:</strong> ${this.turboLigado ? 'Ativado' : 'Desativado'}</p>
        `;
    }
}