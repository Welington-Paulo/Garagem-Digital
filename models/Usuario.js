// models/Usuario.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome é obrigatório.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true, // Garante que não hajam dois e-mails iguais
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Formato de e-mail inválido.']
    },
    senha: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        minlength: [6, 'A senha deve ter no mínimo 6 caracteres.']
    }
}, {
    timestamps: true
});

// Hook (Middleware) do Mongoose: Executa ANTES de salvar o usuário
// Isso garante que a senha seja criptografada automaticamente
usuarioSchema.pre('save', async function(next) {
    // Só criptografa a senha se ela foi modificada (ou é nova)
    if (!this.isModified('senha')) {
        return next();
    }
    // Gera o "salt" e criptografa a senha
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

const UsuarioModel = mongoose.model('Usuario', usuarioSchema);

export default UsuarioModel;