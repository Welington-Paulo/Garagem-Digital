// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Pega o token do cabeçalho (formato: "Bearer TOKEN_AQUI")
            token = req.headers.authorization.split(' ')[1];

            // Verifica se o token é válido
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Anexa o usuário ao objeto 'req' para que as rotas subsequentes possam usá-lo
            req.user = await UserModel.findById(decoded.id).select('-password');
            
            if (!req.user) {
                 return res.status(401).json({ error: 'Não autorizado, usuário não encontrado.' });
            }

            next(); // Prossegue para a próxima função (a rota)
        } catch (error) {
            console.error(error);
            return res.status(401).json({ error: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Não autorizado, nenhum token fornecido.' });
    }
};

export { protect };