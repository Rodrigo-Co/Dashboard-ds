const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const mime = require('mime-types');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs'); 

const app = express();
const port = 3300;

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Substitua pelo seu usuário do MySQL
    password: 'rodrigo', // Substitua pela sua senha do MySQL
    database: 'bancodashboard', // Nome do seu banco de dados
});

db.connect((err) => { 
    if (err) {
        throw err;
    }
    console.log('Conectado ao banco de dados MySQL com Sucesso!');
});
app.use(session({
    secret: 'segredo',
    resave: false,    // Certifique-se de que está configurado corretamente
    saveUninitialized: true, // Mantém a sessão, mesmo sem modificações
    cookie: { secure: false } // Deve estar como "false" se você estiver testando em HTTP (não HTTPS)
}));

app.get('/user/profile', (req, res) => {
    // Verifique se o usuário está logado
    if (!req.session.usuario) {
        return res.status(401).json({ success: false, message: 'Você precisa estar logado.' });
    }

    const userId = req.session.usuario.idusuario;

    // Consulta o banco de dados para obter o nome e a imagem de perfil
    const queryGetUser = 'SELECT nome FROM usuario WHERE idusuario = ?';

    db.query(queryGetUser, [userId], (err, result) => {
        if (err) {
            console.error('Erro ao buscar o usuário no banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar o usuário.' });
        }

        if (result.length > 0) {
            const userData = result[0];
            const userName = userData.nome;

            return res.json({
                success: true,
                nome: userName
            });
        } else {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }
    });
});

// Rota para enviar o token de redefinição de senha
/*app.post('/send-password-reset', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('E-mail é necessário');
    }

    // Verificar se o email está cadastrado
    const queryVerificar = 'SELECT * FROM usuario WHERE email = ?';
    db.query(queryVerificar, [email], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length === 0) {
            return res.status(404).send('E-mail não encontrado.');
        }

        // Gerar um token aleatório
        const token = crypto.randomBytes(20).toString('hex');
        const expiracao = new Date(Date.now() + 3600000); // Token válido por 1 hora
        console.log('Token enviado:', token);
        console.log('Token armazenado:', results[0].resetPasswordToken);

        // Inserir o token no banco de dados
        const queryInsert = 'UPDATE usuario SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?';
        db.query(queryInsert, [token, expiracao, email], (err, result) => {
            if (err) {
                console.error('Erro ao atualizar o token de redefinição de senha:', err);
                return res.status(500).json({ message: 'Erro ao processar o pedido de redefinição de senha.' });
            }

            // Configuração do e-mail
            const mailOptions = {
                from: 'ttecnobrasa@gmail.com',
                to: email,
                subject: 'Redefinição de senha',
                text: `Você solicitou uma redefinição de senha. Use o token abaixo para redefinir sua senha:\n\nToken: ${token}\n\nO token é válido por 1 hora.`
            };

            // Enviar o e-mail
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Erro ao enviar o e-mail:', error);
                    return res.status(500).send('Erro ao enviar o e-mail');
                }
                console.log('E-mail enviado:', info.response);
                res.status(200).send('E-mail de redefinição enviado com sucesso');
            });
        });
    });
});

// Rota para verificar o token
app.post('/verify-token', (req, res) => {
    const { email, token } = req.body;

    const query = 'SELECT * FROM usuario WHERE email = ? AND resetPasswordToken = ? AND resetPasswordExpires > ?';
    db.query(query, [email, token, Date.now()], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Token inválido ou expirado.' });
        }

        res.status(200).json({ success: true, message: 'Token verificado com sucesso. Redefina sua senha.' });
    });
});*/

// Rota para redefinir a senha com criptografia
/*app.post('/reset-password', (req, res) => {
    const { email, novaSenha } = req.body;

    // Log para ver o que está sendo recebido
    console.log('E-mail recebido:', email);
    console.log('Nova senha recebida:', novaSenha);

    if (!email || !novaSenha) {
        return res.status(400).json({ message: 'E-mail e nova senha são necessários.' });
    }

    // Gerar um hash da nova senha
    bcrypt.hash(novaSenha, 10, (err, hash) => {
        if (err) {
            console.error('Erro ao criptografar a senha:', err);
            return res.status(500).json({ message: 'Erro ao criptografar a senha.' });
        }

        // Atualizar a senha no banco de dados
        const queryUpdate = 'UPDATE usuario SET senha = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE email = ?';
        db.query(queryUpdate, [hash, email], (err, result) => {
            if (err) {
                console.error('Erro ao atualizar a senha no banco de dados:', err);
                return res.status(500).json({ message: 'Erro ao redefinir a senha.' });
            }

            // Logar o resultado da query para depuração
            console.log('Resultado da query:', result);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            res.json({ success: true, message: 'Senha redefinida com sucesso!' });
        });
    });
});*/

// Servir arquivos estáticos (CSS, imagens, etc.)
app.use(express.static(path.join(__dirname, 'css')));
//app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'img')));
app.use(express.static(path.join(__dirname, 'html')));
console.log('Servindo arquivos estáticos a partir da pasta public');



// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/indexLogin.html'));
});
app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/indexCadastro.html'));
});
// app.get('/dashboards', (req, res) => {res.sendFile(path.join(__dirname, '/html/dashboard.html'));});



app.get('/dashboard', (req, res) => {
    console.log('Sessão atual:', req.session);
    if (!req.session.usuario) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, '/html/dashboard.html'));
});

app.use('/dashboard', (req, res, next) => {
    if (!req.session.usuario) {
        return res.status(401).send({ message: 'Você precisa se registrar ou logar para acessar esta página.' });
    }
    next();
});

app.get('/getUsuarioId', (req, res) => {
    if (req.session.usuario) {
        res.json({ usuarioId: req.session.usuario.idusuario });  // Retorna o ID do usuário logado
    } else {
        res.status(401).json({ message: 'Usuário não está logado' });
    }
});

// Rota para login de dados com verificação da senha criptografada
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Verificar se o e-mail existe
    const queryVerificar = 'SELECT * FROM usuario WHERE email = ?';
    db.query(queryVerificar, [email], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            const usuario = results[0];

            // Comparar a senha fornecida com a senha criptografada no banco de dados
            bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
                if (err) {
                    console.error('Erro ao comparar senhas:', err);
                    return res.status(500).json({ message: 'Erro no servidor.' });
                }
            
                if (isMatch) {
                    console.log('Usuário logado:', usuario); // Log do usuário logado
                    req.session.usuario = usuario; // Armazena o usuário na sessão
                    res.json({ success: true });
                } else {
                    console.log('Senha incorreta'); // Log para senhas incorretas
                    res.json({ success: false, message: 'Senha incorreta!' });
                }
            });
        } else {
            res.json({ success: false, message: 'E-mail não encontrado!' }); // E-mail não cadastrado
        }
    });
});
// Rota para cadastrar dados com senha criptografada
app.post('/cadastrar', (req, res) => {
    const { nome, email, senha } = req.body;

    // Verificar se o e-mail já está cadastrado
    const queryVerificar = 'SELECT * FROM usuario WHERE email = ?';
    db.query(queryVerificar, [email], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            return res.json({ message: 'Usuário já cadastrado!' });
        }

        // Criptografar a senha antes de armazená-la
        bcrypt.hash(senha, 10, (err, hash) => {
            if (err) {
                console.error('Erro ao criptografar a senha:', err);
                return res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
            }

            // Inserir o novo usuário com a senha criptografada
            const query = 'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)';
            db.query(query, [nome, email, hash], (err, results) => {
                if (err) {
                    throw err;
                }
                res.json({ message: 'Dados cadastrados com sucesso!' });
            });
        });
    });
});

//verificar cadastros
app.post('/verificarCadastro', (req, res) => {
    const { email } = req.body;
    const query = 'SELECT * FROM usuario WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.json({ message: 'Usuário já cadastrado!' });
        } else {
            res.json({ message: 'Usuário não cadastrado!' });
        }
    });
});

// verificar login
app.get('/verificarLogin', (req, res) => {
    if (req.session.usuario) {
        res.json({ logado: true });
    } else {
        res.json({ logado: false });
    }
});

app.get('/getData', (req, res) => {
    const userId = req.session.usuario?.idusuario; // Supondo que o ID do usuário está na sessão (ou substitua por JWT, etc.)
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const query = 'SELECT nome, email FROM usuario WHERE idusuario = ?'; 

    // Passa o ID do usuário de forma segura para o query
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Erro ao buscar os dados do usuário' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Retorna o nome e o email do usuário como JSON
        res.json({
            nome: results[0].nome,
            email: results[0].email
        });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});