import mongoose from 'mongoose';

// 1. Definir o schema
const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  senha: {
    type: String,
    required: true
  }
});

// 2. Adicionar hooks (middlewares)
userSchema.pre('save', async function (next) {
  // Exemplo: criptografar senha antes de salvar
  // this.senha = await bcrypt.hash(this.senha, 10); // se estiver usando bcrypt
  next();
});

// 3. Criar (ou reutilizar) o modelo
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 4. Exportar o modelo
export default User;
