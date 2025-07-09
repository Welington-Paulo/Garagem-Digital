// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose'; // <-- IMPORTADO

// Obter __dirname e __filename em projetos ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY_OPENWEATHER = process.env.OPENWEATHER_API_KEY;
const MONGO_URI = process.env.MONGO_URI; // <-- NOVA VARIÁVEL

// ---- Conexão Robusta com o MongoDB Atlas via Mongoose ----
async function connectToDatabase() {
    // Evita múltiplas tentativas de conexão se já estiver conectado ou conectando
    if (mongoose.connection.readyState >= 1) {
        console.log("=> Mongoose já está conectado.");
        return;
    }

    if (!MONGO_URI) {
        console.error("❌ ERRO FATAL: A variável de ambiente MONGO_URI não está definida no arquivo .env!");
        process.exit(1); // Encerra a aplicação se a URI do banco de dados não for encontrada
    }

    try {
        console.log("🔌 Tentando conectar ao MongoDB Atlas...");
        // Opções de conexão são geralmente gerenciadas pelo driver nas versões recentes do Mongoose
        await mongoose.connect(MONGO_URI);
        
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");

        // Opcional: Ouvir eventos de conexão para mais logs de diagnóstico
        mongoose.connection.on('error', err => {
            console.error("❌ Mongoose erro de conexão subsequente:", err);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn("⚠️ Mongoose foi desconectado.");
        });

    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB na inicialização:", err.message);
        console.error("Verifique sua MONGO_URI (no .env local e nas variáveis de ambiente do Render), acesso de rede no Atlas, e credenciais do usuário.");
        process.exit(1); // Encerra a aplicação se a conexão inicial falhar
    }
}
// --------------------------------------------------------

// Middleware para servir arquivos estáticos da pasta 'public'
// Garante que seu index.html, css, e js do cliente sejam servidos a partir do backend.
app.use(express.static(path.join(__dirname, 'public')));

// Middleware CORS - Permite que seu frontend chame a API do backend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});


// === ARRAYS DE DADOS SIMULADOS (MANTIDOS POR ENQUANTO) ===
const veiculosDestaque = [
    { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável e design inovador.", imagemUrl: "images/maverick_hybrid.jpg" },
    { id: "vd002", modelo: "VW ID.Buzz (Kombi Elétrica)", ano: 2025, destaque: "A nostalgia encontra o futuro da mobilidade elétrica.", imagemUrl: "images/id_buzz.jpg" },
    { id: "vd003", modelo: "Cybertruck Tesla", ano: 2024, destaque: "Resistência e tecnologia de ponta com design futurista.", imagemUrl: "images/cybertruck.jpg" }
];
const servicosGaragem = [
    { id: "svc001", nome: "Diagnóstico Eletrônico Avançado", descricao: "Utilizamos scanners de última geração para identificar precisamente falhas eletrônicas e de sistema.", precoEstimado: "A partir de R$ 150,00" },
    { id: "svc002", nome: "Revisão Completa Premium", descricao: "Checagem de mais de 50 itens, incluindo motor, suspensão, freios, fluidos e filtros.", precoEstimado: "A partir de R$ 450,00" },
    { id: "svc003", nome: "Manutenção de Veículos Elétricos", descricao: "Serviço especializado em baterias, motores elétricos e sistemas de recarga.", precoEstimado: "Consultar" }
];
const dicasManutencao = [
    { id: "d001", titulo: "Calibragem dos Pneus (Geral)", dica: "Mantenha a calibragem correta semanalmente para segurança e economia.", tipoAplicavel: ["geral", "carro", "moto", "caminhao"] },
    { id: "d002", titulo: "Nível do Óleo do Motor (Geral)", dica: "Verifique o nível do óleo com o motor frio e em local plano.", tipoAplicavel: ["geral", "carro", "moto", "caminhao"] },
    { id: "d004", titulo: "Corrente da Moto (Motos)", dica: "Mantenha a corrente da sua moto limpa, lubrificada e com a tensão correta.", tipoAplicavel: ["moto"] },
    { id: "d006", titulo: "Filtro de Ar do Motor (Carro/Caminhão)", dica: "Um filtro de ar sujo pode aumentar o consumo de combustível. Verifique e troque.", tipoAplicavel: ["carro", "caminhao"] },
];

// === ENDPOINTS DE API ===

// Rota de Status da API (NOVA E MUITO ÚTIL)
app.get('/api/status', (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        mongodb_connection: mongoose.connections[0].readyState === 1 ? "Conectado" : "Desconectado"
    });
});

// Endpoints do Arsenal de Dados
app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosGaragem));
app.get('/api/garagem/dicas-manutencao', (req, res) => res.json(dicasManutencao));

// Endpoints da OpenWeatherMap (Proxy)
app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY_OPENWEATHER) return res.status(500).json({ error: 'Chave API OpenWeatherMap não configurada.' });
    if (!city) return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão detalhada.';
        res.status(status).json({ error: message });
    }
});


// Função principal para iniciar o servidor
async function startServer() {
    // 1. Conectar ao banco de dados
    await connectToDatabase();

    // 2. Iniciar o servidor Express para ouvir requisições
    app.listen(PORT, () => {
        console.log(`Servidor backend da Garagem Inteligente rodando na porta ${PORT}`);
        if (!API_KEY_OPENWEATHER) {
            console.warn('[BACKEND] ATENÇÃO: OPENWEATHER_API_KEY não está definida no .env!');
        }
    });
}

// Inicia todo o processo
startServer();