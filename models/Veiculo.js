// models/Veiculo.js
import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema({
    // ... (campos existentes: placa, marca, modelo, etc.)
    placa: { /* ... */ },
    marca: { /* ... */ },
    modelo: { /* ... */ },
    ano: { /* ... */ },
    cor: { /* ... */ },
    tipoVeiculo: { /* ... */ },
    detalhes: { /* ... */ },

    // --- NOVOS CAMPOS ---
    isPublic: {
        type: Boolean,
        default: false // Por padrão, os carros são privados
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Referência ao modelo de Usuário
    }
}, {
    timestamps: true
});

const VeiculoModel = mongoose.model('Veiculo', veiculoSchema);
export default VeiculoModel;