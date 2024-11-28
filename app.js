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

const app = express();
const port = 3300;

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Substitua pelo seu usuário do MySQL
    password: 'cimatec', // Substitua pela sua senha do MySQL
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

// Endpoint para upload e processamento de planilha
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
  
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Considera a primeira aba
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      // Assumindo que a planilha contém colunas específicas para cada gráfico
      const dataForCharts = {
        chart: {
          labels: sheetData.map(row => row.Mês), // Exemplo de coluna "Mês"
          datasets: [{
            label: "Gastos",
            data: sheetData.map(row => row.Gastos), // Exemplo de coluna "Gastos"
            backgroundColor: "#0d6efd",
            borderColor: 'transparent',
            borderWidth: 2.5,
            barPercentage: 0.4,
          }, {
            label: "Economia",
            startAngle: 2,
            data: sheetData.map(row => row.Economia), // Exemplo de coluna "Economia"
            backgroundColor: "#dc3545",
            borderColor: 'transparent',
            borderWidth: 2.5,
            barPercentage: 0.4,
          }]
        }
        /*
        ,
        chart2: {
          labels: sheetData.map(row => row.Item), // Exemplo de coluna "Item"
          datasets: [{
            label: "Consumo",
            data: sheetData.map(row => row.Consumo), // Exemplo de coluna "Consumo"
            backgroundColor: "#f0ad4e",
          }]
        },
        myChartM: {
          labels: sheetData.map(row => row.Mês),
          datasets: [{
            label: "Gastos no Ano",
            data: sheetData.map(row => row['Gastos Ano']), // Exemplo de coluna "Gastos Ano"
            borderColor: "#337ab7",
            backgroundColor: "transparent",
          }]
        },
        myChartD: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            data: [12, 19, 3, 5, 2, 3], // Dados fixos ou processados
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ]
          }]
        }
        */
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