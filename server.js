// server.js

// 1. Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Importação dos Models
import VeiculoModel from './models/Veiculo.js';
import ManutencaoModel from './models/Manutencao.js';
import UsuarioModel from './models/Usuario.js';

// 2. Configuração para obter __dirname em projetos ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 3. Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// 4. Inicialização do Express e definição das constantes
const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY_OPENWEATHER = process.env.OPENWEATHER_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// 5. Função de Conexão Robusta com o MongoDB Atlas
async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!MONGO_URI) {
        console.error("❌ ERRO FATAL: A variável de ambiente MONGO_URI não está definida no arquivo .env!");
        process.exit(1);
    }
    try {
        console.log("🔌 Tentando conectar ao MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
    } catch (err) {
        // <-- LOG DE ERRO MELHORADO -->
        console.error("❌ ERRO FATAL ao conectar ao MongoDB. Verifique sua string de conexão no MONGO_URI e o acesso de IP no Atlas.", err);
        process.exit(1);
    }
}

// 6. Middlewares
app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// 7. Arsenal de Dados Simulados
const veiculosDestaque = [ { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável.", imagemUrl: "images/maverick_hybrid.jpg" } ];
const servicosGaragem = [ { id: "svc001", nome: "Diagnóstico Eletrônico", descricao: "Verificação de sistemas eletrônicos.", precoEstimado: "A partir de R$ 150,00" } ];
const dicasManutencao = [ { id: "d001", titulo: "Calibragem dos Pneus", dica: "Mantenha a calibragem correta.", tipoAplicavel: ["geral"] } ];

// =================================================================
// Middleware de Autenticação (Protetor de Rotas)
// =================================================================
const protegerRota = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
    }
    if (!JWT_SECRET) {
        console.error("❌ ERRO FATAL: JWT_SECRET não está definido no .env!");
        return res.status(500).json({ error: 'Erro de configuração no servidor.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

// === 8. ENDPOINTS DE API ===

// =================================================================
// Endpoints de Autenticação (Rotas Públicas)
// =================================================================

app.post('/api/auth/registrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    try {
        const usuarioExistente = await UsuarioModel.findOne({ email });
        if (usuarioExistente) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }
        const novoUsuario = await UsuarioModel.create({ nome, email, senha });
        res.status(201).json({ id: novoUsuario._id, nome: novoUsuario.nome, email: novoUsuario.email });
    } catch (error) {
        // <-- LOG DE ERRO MELHORADO -->
        console.error("[ERRO NO REGISTRO]:", error); 
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const usuario = await UsuarioModel.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token, nomeUsuario: usuario.nome });
    } catch (error) {
        // <-- LOG DE ERRO MELHORADO -->
        console.error("[ERRO NO LOGIN]:", error); 
        res.status(500).json({ error: 'Erro interno do servidor ao fazer login.' });
    }
});

// =================================================================
// Endpoints CRUD para Veículos (Rotas Protegidas)
// =================================================================

app.post('/api/veiculos', protegerRota, async (req, res) => {
    try {
        const novoVeiculoData = { ...req.body, usuarioId: req.usuarioId }; 
        const veiculoCriado = await VeiculoModel.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        if (error.code === 11000) { return res.status(409).json({ error: `Você já possui um veículo com a placa "${req.body.placa}".` }); }
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ error: messages.join(' ') }); }
        console.error("[BACKEND] Erro ao criar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar veículo.' });
    }
});

app.get('/api/veiculos', protegerRota, async (req, res) => {
    try {
        const todosOsVeiculos = await VeiculoModel.find({ usuarioId: req.usuarioId }).sort({ createdAt: -1 });
        res.json(todosOsVeiculos);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar veículos.' });
    }
});

app.put('/api/veiculos/:id', protegerRota, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ error: 'ID de veículo inválido.' });}
        const veiculo = await VeiculoModel.findById(id);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado.' }); }
        if (veiculo.usuarioId.toString() !== req.usuarioId) { return res.status(403).json({ error: 'Acesso não autorizado a este veículo.' }); }
        const veiculoAtualizado = await VeiculoModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ error: messages.join(' ') }); }
        console.error("[BACKEND] Erro ao atualizar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar veículo.' });
    }
});

app.delete('/api/veiculos/:id', protegerRota, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ error: 'ID de veículo inválido.' });}
        const veiculo = await VeiculoModel.findById(id);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado.' }); }
        if (veiculo.usuarioId.toString() !== req.usuarioId) { return res.status(403).json({ error: 'Acesso não autorizado a este veículo.' }); }
        const veiculoRemovido = await VeiculoModel.findByIdAndDelete(id);
        await ManutencaoModel.deleteMany({ veiculo: id });
        res.status(200).json({ message: 'Veículo e seu histórico de manutenção foram removidos com sucesso.', veiculo: veiculoRemovido });
    } catch (error) {
        console.error("[BACKEND] Erro ao remover veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao remover veículo.' });
    }
});

// (O restante das suas rotas, como Manutenção e OpenWeather, continua aqui...)

// -- Rotas Públicas (Exemplos) --
app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosGaragem));
app.get('/api/garagem/dicas-manutencao', (req, res) => res.json(dicasManutencao));
app.get('/api/forecast/:city', async (req, res) => { /* ... (código da OpenWeather aqui) ... */ });

// 9. Função principal para iniciar o servidor
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend da Garagem Inteligente rodando na porta ${PORT}`);
        if (!API_KEY_OPENWEATHER) { console.warn('[AVISO] OPENWEATHER_API_KEY não definida no .env! O recurso de clima não funcionará.'); }
        if (!JWT_SECRET) { console.warn('[AVISO] JWT_SECRET não definida no .env! A autenticação não será segura.'); }
    });
}

// 10. Inicia todo o processo
startServer();