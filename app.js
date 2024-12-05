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
const XLSX = require('xlsx');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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

var secretstring = crypto.randomBytes(32).toString('hex');
app.use(session({
    secret: secretstring,
    resave: false,    // Certifique-se de que está configurado corretamente
    saveUninitialized: true, // Mantém a sessão, mesmo sem modificações
    cookie: { secure: false } // Deve estar como "false" se você estiver testando em HTTP (não HTTPS)
}));

// Configuração do multer para salvar os arquivos em uma pasta chamada "uploads"
const upload = multer({ 
    dest: 'uploads/', // Diretório onde os arquivos serão armazenados temporariamente
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB para os arquivos
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      if (ext !== '.xlsx' && ext !== '.csv') {
        return cb(new Error('Apenas arquivos .xlsx ou .csv são permitidos.'));
      }
      cb(null, true);
    }
  });

  // Configuração da estratégia do Google
passport.use(
    new GoogleStrategy(
        {
            clientID: '1081687392332-li4jmoeru81a5m692f32r79ud0ncdp3i.apps.googleusercontent.com', // Substitua pelo ID do Cliente obtido no Google Cloud Console
            clientSecret: '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', // Substitua pelo Secret obtido no Google Cloud Console
            callbackURL: '/auth/google/callback' // URL de redirecionamento configurada no Google Console
        },
        (accessToken, refreshToken, profile, done) => {
            console.log('Profile:', JSON.stringify(profile, null, 2));
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;

    if (!email) {
        console.error('Email não disponível no perfil do usuário.');
        return done(new Error('Email não disponível no perfil do usuário.'));
    }   

            // Verifique ou cadastre o usuário no banco de dados
            const query = 'SELECT * FROM usuario WHERE email = ?';
            db.query(query, [email], (err, results) => {
                if (err) return done(err);

                if (results.length > 0) {
                    // Usuário já existe
                    return done(null, results[0]);
                } else {
                    // Cadastrar o novo usuário
                    const insertQuery = 'INSERT INTO usuario (nome, email) VALUES (?, ?)';
                    if (email && name) {
                        db.query(insertQuery, [name, email], (err, result) => {
                            if (err) {
                            console.error('Erro ao inserir usuário no banco de dados:', err);
                            return done(err);
                        }
        
                            const novoUsuario = { idusuario: result.insertId, nome: name, email: email };
                            return done(null, novoUsuario);
                        });
                    } else {
                        console.error('Nome ou email não disponíveis para cadastro.');
                        return done(new Error('Dados insuficientes para cadastro.'));
                    }
                }
            });
        }
    )
);

// Serializar e desserializar o usuário na sessão
passport.serializeUser((user, done) => {
    done(null, user.idusuario); // Use o ID do usuário
});

passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM usuario WHERE idusuario = ?';
    db.query(query, [id], (err, results) => {
        if (err) return done(err);
        if (results.length > 0) {
            done(null, results[0]);
        } else {
            done(new Error('Usuário não encontrado.'));
        }
    });
});

// Middleware de sessão
app.use(passport.initialize());
app.use(passport.session());

// Rota para iniciar login com Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Rota de callback do Google após autenticação
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Salvando o usuário na sessão
        req.session.usuario = {
            idusuario: req.user.idusuario,
            nome: req.user.nome,
            email: req.user.email,
        };

        // Redirecionar após login
        res.redirect('/');
    }
);

// Rota protegida para exibir o dashboard
app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.redirect('/');
    }
});

const ensureAuthenticated = (req, res, next) => {
    if (req.session.usuario) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Você precisa estar logado.' });
};


    app.get('/user/profile', (req, res) => {

        const userId = req.session.usuario.idusuario;

        // Consulta o banco de dados para obter o nome e a imagem de perfil
        const queryGetUser = 'SELECT nome FROM usuario WHERE idusuario = ?';

        db.query(queryGetUser, [userId], (err, result) => {
            if (err) {
                console.error('Erro ao buscar o usuário no banco de dados:', err);
                return res.status(500).json({ success: false, message: 'Erro ao buscar o usuário.' });
            }

            if (result.length > 0) {
                const userName = result[0].nome;

                return res.json({
                    success: true,
                    nome: userName
                });
            } else {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
            }
        });
    });

// Endpoint para upload e processamento de planilha
const uploadDir = path.join(__dirname, 'uploads');
// Endpoint para upload e processamento de planilhas
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Verifica se o arquivo foi recebido
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const filePath = req.file.path; // Caminho do novo arquivo

        // Remove arquivos existentes na pasta 'uploads' (assíncrono)
        await new Promise((resolve, reject) => {
            fs.readdir(uploadDir, (err, files) => {
                if (err) {
                    console.error('Erro ao ler a pasta uploads:', err);
                    return reject(err);
                }

                const removeFiles = files.map(file => {
                    if (file !== path.basename(filePath)) { // Não remove o arquivo atual
                        return new Promise((resolveFile, rejectFile) => {
                            fs.unlink(path.join(uploadDir, file), err => {
                                if (err) {
                                    console.error(`Erro ao excluir o arquivo ${file}:`, err);
                                    rejectFile(err);
                                } else {
                                    resolveFile();
                                }
                            });
                        });
                    }
                });

                Promise.all(removeFiles)
                    .then(resolve)
                    .catch(reject);
            });
        });

        // Processa o novo arquivo após garantir que está salvo
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Considera a primeira aba
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Dados para gráficos
        const dataForCharts = {
            chart: {
                labels: sheetData.map(row => row.Mês), // Exemplo de coluna "Mês"
                datasets: [
                    {
                        label: 'Gastos',
                        data: sheetData.map(row => row.Gastos), // Exemplo de coluna "Gastos"
                        backgroundColor: '#0d6efd',
                        borderColor: 'transparent',
                        borderWidth: 2.5,
                        barPercentage: 0.4,
                    },
                    {
                        label: 'Economia',
                        startAngle: 2,
                        data: sheetData.map(row => row.Economia), // Exemplo de coluna "Economia"
                        backgroundColor: '#dc3545',
                        borderColor: 'transparent',
                        borderWidth: 2.5,
                        barPercentage: 0.4,
                    },
                ],
            },
        };

        res.json({
            message: 'Planilha processada com sucesso!',
            data: dataForCharts,
        });
    } catch (error) {
        console.error('Erro ao processar a planilha:', error);
        res.status(500).json({ message: 'Erro ao processar a planilha.', error });
    }
});

// Endpoint para buscar o arquivo da pasta de uploads
app.get('/uploaded-file', (req, res) => {
    const uploadFolder = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadFolder);
    
    if (files.length > 0) {
        // Se houver arquivos na pasta, envia o primeiro arquivo encontrado
        const filePath = path.join(uploadFolder, files[0]);
         // Configurar cabeçalhos para enviar o arquivo binário corretamente
         //res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'Nenhum arquivo encontrado na pasta de uploads.' });
    }
});

// Endpoint para contar arquivos na pasta uploads
app.get('/uploads/count', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');

    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Erro ao listar arquivos na pasta uploads:', err);
            return res.status(500).json({ message: 'Erro ao contar arquivos.' });
        }

        res.json({ count: files.length });
    });
});

// Servir arquivos estáticos (CSS, imagens, etc.)
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'img')));
app.use(express.static(path.join(__dirname, 'html')));
app.use(express.static(path.join(__dirname, 'js')));
console.log('Servindo arquivos estáticos a partir da pasta public');



// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/login.html'));
});




app.get('/dashboard', (req, res) => {
    console.log('Sessão atual:', req.session);
    if (!req.session.usuario) {
        res.redirect('/login');
        return;
    }
    res.sendFile(path.join(__dirname, '/html/dashboard.html'));
});

;

app.get('/getUsuarioId', (req, res) => {
    if (req.session.usuario) {
        res.json({ usuarioId: req.session.usuario.idusuario });  // Retorna o ID do usuário logado
    } else {
        res.status(401).json({ message: 'Usuário não está logado' });
    }
});

// Rota para login de dados com verificação da senha criptografada
app.post('/login', (req, res) => {
    const { emails, senha } = req.body;
    
    // Verificar se o e-mail existe
    const queryVerificar = 'SELECT * FROM usuario WHERE email = ?';
    db.query(queryVerificar, [emails], (err, results) => {
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
    const { name, email, password } = req.body;

    // Verificar se os campos obrigatórios foram enviados
    if (!name || !email) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }
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
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Erro ao criptografar a senha:', err);
                return res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
            }

            // Inserir o novo usuário com a senha criptografada
            const query = 'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)';
            db.query(query, [name, email, hash], (err, results) => {
                if (err) {
                    throw err;
                }
                res.json({ message: 'Dados cadastrados com sucesso!' });
            });
        });
    });
});

app.post('/logout', (req, res) => {
    if (req.session) {
        // Destrói a sessão
        req.session.destroy(err => {
            if (err) {
                console.error('Erro ao destruir a sessão:', err);
                return res.status(500).json({ success: false, message: 'Erro ao deslogar.' });
            }
            // Envia uma resposta de sucesso
            res.clearCookie('connect.sid'); // Opcional: remove o cookie da sessão
            return res.json({ success: true, message: 'Logout bem-sucedido.' });
        });
    } else {
        return res.status(400).json({ success: false, message: 'Nenhuma sessão ativa.' });
    }
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
    const userId = req.session.usuario?.idusuario;
    
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

// Routes
app.post('/submit', (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        return res.status(400).json({ message: 'Preencha todos os campos.' });
    }

    const query = 'INSERT INTO usuario (nome, email) VALUES (?, ?)';
    db.query(query, [fullName, email], (err, results) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            return res.status(500).json({ message: 'Erro ao cadastrar o usuário.' });
        }
        res.status(201).json({ message: 'Dados do usuário cadastrados com sucesso.' });
    });
});

app.post('/update-perfil', (req, res) => {
    const newUserName = req.body.name;
    const userId = req.session.usuario.idusuario; // Supondo que você tenha o ID do usuário na sessão
  
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }
  
    const query = 'UPDATE usuario SET nome = ? WHERE idusuario = ?';
  
    db.query(query, [newUserName, userId], (err, results) => {
      if (err) {
        console.error('Erro ao atualizar os dados:', err);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar os dados' });
      }
  
      if (results.affectedRows > 0) {
        res.json({ success: true, message: 'Dados atualizados com sucesso' });
      } else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }
    });
  });


  /// Endpoint para salvar o número de pessoas
app.post('/pessoascasa', (req, res) => {
    const userId = req.session.usuario.idusuario;
    const pessoascasa = req.body.pessoascasa;

    if (!pessoascasa || isNaN(pessoascasa)) {
        return res.status(400).json({ success: false, message: 'Número inválido!' });
    }

    // Insere ou atualiza o valor no banco
    const sql = 'UPDATE usuario SET pessoascasa = ? WHERE idusuario = ?';
    db.query(sql, [pessoascasa, userId], (err) => {
        if (err) {
            console.error('Erro ao salvar no banco:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor!' });
        }
        res.json({ success: true });
    });
});

// Endpoint para obter o número de pessoas
app.get('/get-pessoascasa', (req, res) => {
    const userId = req.session.usuario.idusuario;
    const sql = 'SELECT pessoascasa FROM usuario WHERE idusuario = ?';
    db.query(sql, [userId],(err, results) => {
        if (err) {
            console.error('Erro ao buscar no banco:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor!' });
        }
        if (results.length > 0) {
            res.json({ pessoas: results[0].pessoascasa });
        } else {
            res.json({ pessoas: 1 }); // Valor padrão se nada estiver no banco
        }
    });
});
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});