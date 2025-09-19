// =================================================================
//                      SERVER.JS COMPLETO
//      Com Autenticação (JWT), Autorização e Controle de Acesso
// =================================================================

// 1. Importações Essenciais
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import jwt from 'jsonwebtoken'; // Para gerar tokens de autenticação

// 2. Importação de Models do Banco de Dados
import VeiculoModel from './models/Veiculo.js';
import ManutencaoModel from './models/Manutencao.js';
import UserModel from './models/User.js'; // Novo model de usuário

// 3. Importação do Middleware de Proteção de Rotas
import { protect } from './middleware/authMiddleware.js'; // Nosso "guarda" de rotas

// 4. Configuração Inicial
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config(); // Carrega variáveis do arquivo .env

// 5. Constantes da Aplicação
const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const API_KEY_OPENWEATHER = process.env.OPENWEATHER_API_KEY;

// 6. Função de Conexão com o Banco de Dados (Robusta)
async function connectToDatabase() {
    if (!MONGO_URI) {
        console.error("❌ ERRO FATAL: A variável de ambiente MONGO_URI não está definida!");
        process.exit(1);
    }
    try {
        console.log("🔌 Tentando conectar ao MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB:", err.message);
        process.exit(1);
    }
}

// 7. Middlewares Globais do Express
app.use(cors()); // Permite requisições de outras origens (frontend)
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos

// 8. Arsenal de Dados Simulados (para a aba de Recursos da Garagem)
const veiculosDestaque = [ { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável.", imagemUrl: "images/maverick_hybrid.jpg" } ];
const servicosGaragem = [ { id: "svc001", nome: "Diagnóstico Eletrônico", descricao: "Verificação de sistemas eletrônicos.", precoEstimado: "A partir de R$ 150,00" } ];
const dicasManutencao = [ { id: "d001", titulo: "Calibragem dos Pneus", dica: "Mantenha a calibragem correta.", tipoAplicavel: ["geral"] } ];


// =================================================================
//                      NOVAS ROTAS DE AUTENTICAÇÃO
// =================================================================

/**
 * @route   POST /api/users/register
 * @desc    Registra um novo usuário
 * @access  Público
 */
app.post('/api/users/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await UserModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'Usuário com este e-mail já existe.' });
        }
        const user = await UserModel.create({ name, email, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route   POST /api/users/login
 * @desc    Autentica um usuário e retorna um token
 * @access  Público
 */
app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
            });
        } else {
            res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
    } catch (error) {
        console.error("[BACKEND] Erro no login:", error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// =================================================================
//         ROTAS DE VEÍCULOS - AGORA PROTEGIDAS E COM AUTORIZAÇÃO
// =================================================================

/**
 * @route   POST /api/veiculos
 * @desc    Cria um novo veículo para o usuário logado
 * @access  Privado (requer login)
 */
app.post('/api/veiculos', protect, async (req, res) => {
    try {
        // Associa o veículo ao ID do usuário que está fazendo a requisição
        const novoVeiculoData = { ...req.body, owner: req.user._id };
        const veiculoCriado = await VeiculoModel.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: `Veículo com a placa "${req.body.placa}" já existe.` });
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(' ') });
        }
        console.error("[BACKEND] Erro ao criar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar veículo.' });
    }
});

/**
 * @route   GET /api/veiculos
 * @desc    Lista veículos (públicos de todos + privados do usuário logado)
 * @access  Privado (requer login)
 */
app.get('/api/veiculos', protect, async (req, res) => {
    try {
        // A mágica acontece aqui: busca veículos que satisfaçam UMA das condições:
        // 1. O campo isPublic é `true`
        // 2. O campo owner é igual ao ID do usuário logado
        const veiculosVisiveis = await VeiculoModel.find({
            $or: [{ isPublic: true }, { owner: req.user._id }]
        }).populate('owner', 'name').sort({ createdAt: -1 }); // 'populate' adiciona o nome do dono ao resultado
        
        res.json(veiculosVisiveis);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar veículos.' });
    }
});

/**
 * @route   PUT /api/veiculos/:id
 * @desc    Atualiza um veículo, SE o usuário logado for o dono
 * @access  Privado (requer login e propriedade)
 */
app.put('/api/veiculos/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const veiculo = await VeiculoModel.findById(id);

        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        
        // **VERIFICAÇÃO DE PROPRIEDADE**
        if (veiculo.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Ação não permitida. Você não é o dono deste veículo.' });
        }

        const veiculoAtualizado = await VeiculoModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(' ') });
        }
        console.error("[BACKEND] Erro ao atualizar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar veículo.' });
    }
});

/**
 * @route   DELETE /api/veiculos/:id
 * @desc    Remove um veículo, SE o usuário logado for o dono
 * @access  Privado (requer login e propriedade)
 */
app.delete('/api/veiculos/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const veiculo = await VeiculoModel.findById(id);

        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        
        // **VERIFICAÇÃO DE PROPRIEDADE**
        if (veiculo.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Ação não permitida. Você não é o dono deste veículo.' });
        }

        // Deleta o veículo e todo o seu histórico de manutenção associado
        await ManutencaoModel.deleteMany({ veiculo: id });
        await veiculo.remove(); // Usa o método .remove() no documento encontrado
        
        res.status(200).json({ message: 'Veículo e seu histórico de manutenção foram removidos com sucesso.' });
    } catch (error) {
        console.error("[BACKEND] Erro ao remover veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao remover veículo.' });
    }
});


// =================================================================
//        ROTAS DE MANUTENÇÃO - TAMBÉM PROTEGIDAS E COM AUTORIZAÇÃO
// =================================================================

/**
 * @route   POST /api/veiculos/:veiculoId/manutencoes
 * @desc    Cria uma manutenção para um veículo, SE o usuário for o dono
 * @access  Privado (requer login e propriedade do veículo)
 */
app.post('/api/veiculos/:veiculoId/manutencoes', protect, async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const veiculo = await VeiculoModel.findById(veiculoId);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });
        
        // **VERIFICAÇÃO DE PROPRIEDADE**
        if (veiculo.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Não é possível adicionar manutenção a um veículo que não é seu.' });
        }

        const novaManutencaoData = { ...req.body, veiculo: veiculoId };
        const manutencaoCriada = await ManutencaoModel.create(novaManutencaoData);
        res.status(201).json(manutencaoCriada);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(' ') });
        }
        console.error(`[BACKEND] Erro ao criar manutenção para o veículo ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

/**
 * @route   GET /api/veiculos/:veiculoId/manutencoes
 * @desc    Lista manutenções de um veículo, SE o usuário for o dono ou o carro for público
 * @access  Privado (requer login)
 */
app.get('/api/veiculos/:veiculoId/manutencoes', protect, async (req, res) => {
    const { veiculoId } = req.params;
    try {
        const veiculo = await VeiculoModel.findById(veiculoId);
        if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado.' });

        // **VERIFICAÇÃO DE VISIBILIDADE**
        const isOwner = veiculo.owner.toString() === req.user._id.toString();
        const isPublic = veiculo.isPublic;
        if (!isOwner && !isPublic) {
            return res.status(403).json({ error: 'Você não tem permissão para ver o histórico deste veículo.' });
        }

        const manutencoes = await ManutencaoModel.find({ veiculo: veiculoId }).sort({ data: -1 });
        res.status(200).json(manutencoes);
    } catch (error) {
        console.error(`[BACKEND] Erro ao buscar manutenções para o veículo ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// =================================================================
//        ROTAS PÚBLICAS E DE SERVIÇOS (sem alterações)
// =================================================================

app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosGaragem));
app.get('/api/garagem/dicas-manutencao', (req, res) => res.json(dicasManutencao));

app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY_OPENWEATHER) return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada.' });
    if (!city) return res.status(400).json({ error: 'O nome da cidade é obrigatório.' });
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo.';
        console.error(`[BACKEND] Erro no proxy do clima para "${city}":`, message);
        res.status(status).json({ error: message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        mongodb_connection: mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado"
    });
});


// =================================================================
//        INICIALIZAÇÃO DO SERVIDOR
// =================================================================
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend da Garagem Inteligente rodando na porta ${PORT}`);
        if (!process.env.JWT_SECRET) {
            console.warn('[BACKEND] ⚠️  ATENÇÃO: JWT_SECRET não definida no .env! A autenticação não funcionará de forma segura.');
        } else {
            console.log('[BACKEND] Segredo JWT carregado.');
        }
        if (!API_KEY_OPENWEATHER) {
            console.warn('[BACKEND] ⚠️  ATENÇÃO: OPENWEATHER_API_KEY não definida no .env! O recurso de clima não funcionará.');
        } else {
            console.log('[BACKEND] Chave API OpenWeatherMap carregada.');
        }
    });
}

startServer();