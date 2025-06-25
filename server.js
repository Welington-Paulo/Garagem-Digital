// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY_OPENWEATHER = process.env.OPENWEATHER_API_KEY;

app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// === ARSENAL DE DADOS DA GARAGEM (SIMULADO) ===
const veiculosDestaque = [
    { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável e design inovador.", imagemUrl: "./img/maverick_hybrid.jpg" },
    { id: "vd002", modelo: "VW ID.Buzz (Kombi Elétrica)", ano: 2025, destaque: "A nostalgia encontra o futuro da mobilidade elétrica.", imagemUrl: "./img/id_buzz.webp" },
    { id: "vd003", modelo: "Cybertruck Tesla", ano: 2024, destaque: "Resistência e tecnologia de ponta com design futurista.", imagemUrl: "./img/cybertruck.webp" }
];
const servicosGaragem = [
    { id: "svc001", nome: "Diagnóstico Eletrônico Avançado", descricao: "Utilizamos scanners de última geração para identificar precisamente falhas eletrônicas e de sistema.", precoEstimado: "A partir de R$ 150,00" },
    { id: "svc002", nome: "Revisão Completa Premium", descricao: "Checagem de mais de 50 itens, incluindo motor, suspensão, freios, fluidos e filtros.", precoEstimado: "A partir de R$ 450,00" },
    { id: "svc003", nome: "Manutenção de Veículos Elétricos", descricao: "Serviço especializado em baterias, motores elétricos e sistemas de recarga.", precoEstimado: "Consultar" }
];
// DICAS DE MANUTENÇÃO COM CAMPO 'tipoAplicavel'
const dicasManutencao = [
    { id: "d001", titulo: "Verifique os Pneus Regularmente", dica: "Mantenha a calibragem correta e verifique o desgaste para garantir segurança e economia de combustível.", tipoAplicavel: ["geral", "carro", "moto", "caminhao"] },
    { id: "d002", titulo: "Troca de Óleo e Filtros", dica: "Siga o manual do proprietário para os intervalos de troca de óleo e filtros, essencial para a vida útil do motor.", tipoAplicavel: ["geral", "carro", "moto", "caminhao"] },
    { id: "d003", titulo: "Fluidos e Vazamentos", dica: "Verifique periodicamente os níveis de todos os fluidos (arrefecimento, freio, direção) e procure por vazamentos.", tipoAplicavel: ["geral", "carro", "caminhao"] },
    { id: "d004", titulo: "Bateria em Dia", dica: "Limpe os terminais da bateria e verifique sua carga, especialmente antes de longas viagens ou em climas frios.", tipoAplicavel: ["geral", "carro", "moto"] },
    { id: "d005", titulo: "Corrente da Moto (Motos)", dica: "Mantenha a corrente da sua moto limpa, lubrificada e com a tensão correta.", tipoAplicavel: ["moto"] },
    { id: "d006", titulo: "Freios do Caminhão (Caminhões)", dica: "Verifique regularmente o sistema de freios pneumáticos e o desgaste das lonas/pastilhas.", tipoAplicavel: ["caminhao"] }
];

// === ENDPOINTS DA OPENWEATHERMAP (PROXY) ===
app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY_OPENWEATHER) return res.status(500).json({ error: 'Chave API OpenWeatherMap não configurada no servidor.' });
    if (!city) return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=pt_br`;
    try {
        console.log(`[BACKEND] GET /api/forecast/${city}`);
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || 'Erro ao buscar previsão detalhada.';
        console.error(`[BACKEND] Erro forecast ${city}: ${status} - ${message}`);
        res.status(status).json({ error: message });
    }
});

// === NOVOS ENDPOINTS GET PARA O ARSENAL DE DADOS ===
app.get('/api/garagem/veiculos-destaque', (req, res) => {
    console.log(`[BACKEND] GET /api/garagem/veiculos-destaque`);
    res.json(veiculosDestaque);
});

app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    console.log(`[BACKEND] GET /api/garagem/servicos-oferecidos`);
    res.json(servicosGaragem);
});

app.get('/api/garagem/dicas-manutencao', (req, res) => {
    console.log(`[BACKEND] GET /api/garagem/dicas-manutencao`);
    res.json(dicasManutencao); // Retorna todas as dicas
});

// Rota raiz e app.listen
app.get('/', (req, res) => res.send('Servidor Backend da Garagem Inteligente está operacional!'));
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    if (!API_KEY_OPENWEATHER) console.warn('[BACKEND] ATENÇÃO: OPENWEATHER_API_KEY não definida no .env!');
    else console.log('[BACKEND] Chave API OpenWeatherMap carregada.');
});
