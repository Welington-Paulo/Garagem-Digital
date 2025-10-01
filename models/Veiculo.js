// models/Veiculo.js
import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // <-- NOVO CAMPO: Para exibir o nome do dono facilmente -->
    nomeDono: {
        type: String,
        required: [true, 'O nome do dono é obrigatório.']
    },
    // <-- NOVO CAMPO: Para controlar a visibilidade -->
    publico: {
        type: Boolean,
        default: false // Todo veículo começa como privado por padrão
    },
    placa: { 
        type: String, 
        required: [true, 'A placa é obrigatória.'],
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/, 'Formato de placa inválido.']
    },
    marca: { 
        type: String, 
        required: [true, 'A marca é obrigatória.'],
        trim: true
    },
    modelo: { 
        type: String, 
        required: [true, 'O modelo é obrigatório.'],
        trim: true
    },
    ano: { 
        type: Number, 
        required: [true, 'O ano é obrigatório.'],
        min: [1886, 'O ano deve ser no mínimo 1886.'],
        max: [new Date().getFullYear() + 2, 'O ano não pode ser muito no futuro.']
    },
    cor: { 
        type: String,
        trim: true,
        default: 'Não informada'
    },
    tipoVeiculo: {
        type: String,
        required: [true, 'O tipo de veículo é obrigatório.'],
        enum: ['Carro', 'CarroEsportivo', 'Caminhao', 'Veiculo']
    },
    detalhes: {
        numeroPortas: { type: Number },
        velocidadeMaximaTurbo: { type: Number },
        capacidadeCarga: { type: Number }
    }
}, { 
    timestamps: true 
});

veiculoSchema.index({ placa: 1, usuarioId: 1 }, { unique: true });

const VeiculoModel = mongoose.model('Veiculo', veiculoSchema);

export default VeiculoModel;