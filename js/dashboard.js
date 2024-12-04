// Other important pens.
// Map: https://codepen.io/themustafaomar/pen/ZEGJeZq
// Navbar: https://codepen.io/themustafaomar/pen/VKbQyZ

'use strict'



function query(selector) {
  return document.querySelector(selector);
}

function find(el, selector) {
  let finded
  return (finded = el.querySelector(selector)) ? finded : null
}

function siblings(el) {
  const siblings = []
  for (let sibling of el.parentNode.children) {
    if (sibling !== el) {
      siblings.push(sibling)
    }
  }
  return siblings
}

let chartData = {}; // Variável global para armazenar os dados

const showAsideBtn = document.querySelector('.show-side-btn'); // Seletor DOM nativo
const sidebar = document.querySelector('.sidebar'); // Seletor DOM nativo
const wrapper = document.querySelector('#wrapper'); // Seletor DOM nativo

if (showAsideBtn) {
  showAsideBtn.addEventListener('click', function () {
    const targetSidebar = document.querySelector(`#${this.dataset.show}`);
    if (targetSidebar) {
      targetSidebar.classList.toggle('show-sidebar');
    }
    wrapper.classList.toggle('fullwidth');
    
    updateCharts();
  });
}

// Verifica o tamanho inicial da janela
if (window.innerWidth < 767 && sidebar) {
  sidebar.classList.add('show-sidebar');
}

// Adiciona evento de redimensionamento da janela
window.addEventListener('resize', function () {
  if (window.innerWidth > 767 && sidebar) {
    sidebar.classList.remove('show-sidebar');
  }
});

// dropdown menu in the side nav
var slideNavDropdown = query('.sidebar-dropdown');

query('.sidebar .categories').addEventListener('click', function (event) {
  const item = event.target.closest('.has-dropdown')

  // Verifica se o item clicado é o link de upload
  if (event.target.id === 'uploadTrigger') {
    return; // Se for o link de upload, ignore o processamento do menu dropdown
  }

  if (! item) {
    return;
  }

  item.classList.toggle('opened')

  siblings(item).forEach(sibling => {
    sibling.classList.remove('opened')
  })

  if (item.classList.contains('opened')) {
    const toOpen = find(item, '.sidebar-dropdown')

    if (toOpen) {
      toOpen.classList.add('active')
    }

    siblings(item).forEach(sibling => {
      const toClose = find(sibling, '.sidebar-dropdown')

      if (toClose) {
        toClose.classList.remove('active')
      }
    })
  } else {
    find(item, '.sidebar-dropdown').classList.toggle('active')
  }
});

query('.sidebar .close-aside').addEventListener('click', function () {
  $(`#${this.dataset.close}`).classList.add('show-sidebar')
  wrapper.classList.remove('margin')
})


// Global defaults
Chart.defaults.global.animation.duration = 2000; // Animation duration
Chart.defaults.global.title.display = false; // Remove title
Chart.defaults.global.defaultFontColor = '#71748c'; // Font color
Chart.defaults.global.defaultFontSize = 13; // Font size for every label

// Tooltip global resets
Chart.defaults.global.tooltips.backgroundColor = '#111827'
Chart.defaults.global.tooltips.borderColor = 'blue'

// Gridlines global resets
Chart.defaults.scale.gridLines.zeroLineColor = '#3b3d56'
Chart.defaults.scale.gridLines.color = '#3b3d56'
Chart.defaults.scale.gridLines.drawBorder = false

// Legend global resets
Chart.defaults.global.legend.labels.padding = 0;
Chart.defaults.global.legend.display = false;

// Ticks global resets
Chart.defaults.scale.ticks.fontSize = 12
Chart.defaults.scale.ticks.fontColor = '#71748c'
Chart.defaults.scale.ticks.beginAtZero = false
Chart.defaults.scale.ticks.padding = 10

// Elements globals
Chart.defaults.global.elements.point.radius = 0

// Responsivess
Chart.defaults.global.responsive = true
Chart.defaults.global.maintainAspectRatio = false

let chart;
let chart2, myChartM, myChartD;

// Função para atualizar todos os gráficos
function updateCharts() {
  console.log(chart);
  // Verifica e atualiza o gráfico chart
  if (chart) {
    chart.update();
    chart.resize();
    console.log('Chart 1 Atualizada')
  }

  // Verifica e atualiza o gráfico chart2
  if (chart2) {
    chart2.update();
    chart2.resize();
    console.log('Chart 2 Atualizada')
  }

  // Verifica e atualiza o gráfico myChart
  if (myChartM) {
    myChartM.update();
    myChartM.resize();
    console.log('Chart 3 Atualizada')
  }

  // Verifica e atualiza o gráfico myChartD
  if (myChartD) {
    myChartD.update();
    myChartD.resize();
    console.log('Chart Donut Atualizada')
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const uploadTrigger = document.getElementById('uploadTrigger');
  const fileInput = document.getElementById('fileInput');

  // Objeto para armazenar instâncias dos gráficos
  const charts = {};
  

  // Função para buscar e processar o arquivo retornado
  function fetchUploadedFile() {
    fetch('/uploaded-file')
      .then(response => {
        if (response.ok) {
          return response.blob(); // A resposta será um Blob (arquivo binário)
        } else {
          throw new Error('Nenhum arquivo encontrado');
        }
      })
      .then(blob => {
        // Usando a biblioteca XLSX para ler o arquivo binário
        const reader = new FileReader();
        reader.onload = function(e) {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Processa a primeira aba do arquivo Excel
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          
          // Converte os dados para o formato que o gráfico espera
          const filteredData2 = sheetData.filter(row => row.Mês && row.Tomadas && row.Lampadas);
          const chart1Data = {
            labels: filteredData2.map(row => row.Mês), // Exemplo de coluna "Mês"
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
          };
          const chart2Data = {
            labels: filteredData2.map(row => row.Mês),
            datasets: [{
              label: "Tomadas",
              data: filteredData2.map(row => row.Tomadas),
              lineTension: 0.2,
              borderColor: '#d9534f',
              borderWidth: 1.5,
              showLine: true,
              backgroundColor: 'transparent'
            },{
              label: "Lâmpadas",
              data: filteredData2.map(row => row.Lampadas),
              lineTension: 0.2,
              borderColor: '#ffc107',
              borderWidth: 1.5,
              showLine: true,
              backgroundColor: 'transparent'
            }]
          };
          const chart3Data = {
            labels: filteredData2.map(row => row.Mês),
            datasets: [{
              label: "2023",
              data: sheetData.map(row => row.y2023),
              lineTension: 0,
              borderColor: '#d9534f',
              borderWidth: 1.5,
              showLine: true,
              backgroundColor: 'transparent'
            },{
              label: "2022",
              data: sheetData.map(row => row.y2022),
              lineTension: 0,
              borderColor: '#00FF00',
              borderWidth: 1.5,
              showLine: true,
              backgroundColor: 'transparent'
            },{
              label: "2021",
              data: sheetData.map(row => row.y2021),
              lineTension: 0,
              borderColor: '#00FFFF',
              borderWidth: 1.5,
              showLine: true,
              backgroundColor: 'transparent'
            },{
              label: "2020",
              data: sheetData.map(row => row.y2020),
              lineTension: 0,
              borderColor: '#3b3d56',
              borderWidth: 1.5,
              showLine: true,
              backgroundColor: 'transparent'
            }
          ]
          };
          
          const filteredData = sheetData.filter(row => row.Estações && row.GastoE);
          const chart4Data = {
            labels: filteredData .map(row => row.Estações),
              datasets: [{
              label: "Verão",
              data: filteredData.map(row => row.GastoE),
              backgroundColor: [
                'rgb(247, 110, 19)',
                'rgba(247, 231, 19, 0.932)',
                'rgb(54, 162, 235)',
                'rgb(46, 155, 2)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1.5)',
                'rgba(255, 206, 86, 1.5)',
                'rgba(54, 162, 235, 1.5)',
                'rgba(35, 124, 0, 1.5)'
              ],
              borderWidth: 1
            }]
          };

          // Atualiza o gráfico com os dados processados
          //updateChart(chartData); // Função para atualizar o gráfico com novos dados
          // Atualiza o gráfico com os dados processados
          initChart('myChart', chart1Data, 'bar'); // Chama a função de inicialização
          initChart('myChart2', chart2Data, 'line'); // Chama a função de inicialização
          initChart('chart3', chart3Data, 'line'); // Chama a função de inicialização
          initChart('donutChart', chart4Data, 'doughnut'); // Chama a função de inicialização
        };
        reader.readAsBinaryString(blob);
      })
      .catch(error => {
        console.error('Erro ao buscar arquivo:', error);
      });
  }

   // Função genérica para inicializar gráficos
  function initChart(chartId, chartData, chartType) {
    const ctx = document.getElementById(chartId);
    if (!ctx) {
      console.error(`Canvas com ID "${chartId}" não encontrado.`);
      return;
    }

    // Verifica se já existe um gráfico associado ao ID
    if (charts[chartId]) {
      charts[chartId].data = chartData;
      charts[chartId].type = chartType; // Atualiza o tipo se necessário
      charts[chartId].update();
    } else {
      // Cria um novo gráfico
      charts[chartId] = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 20,
              fontSize: 14,
              padding: 10,
              fontColor: '#1a1a1a',
              usePointStyle: false,
            },
          },
          scales: chartType === 'bar' || chartType === 'line' ? {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              grid: {
                display: true,
              },
            },
          } : {},
        } 
      });
    }
  }
  // Chama a função para buscar o arquivo na pasta
  fetchUploadedFile();

  // Abre a janela de arquivos quando o link for clicado
  uploadTrigger.addEventListener('click', function (event) {
    event.preventDefault(); // Evita o comportamento padrão do link
    fileInput.click(); // Simula o clique no input de arquivo
    console.log('Link clicado!');
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];

      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, envie um arquivo válido (.xlsx ou .csv).');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      fetch('/upload', {
        method: 'POST',
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          alert('Arquivo processado com sucesso!');
          // Use os dados retornados para atualizar os gráficos
          initChart('myChart', data.chart1Data, 'bar');
          initChart('myChart2', data.chart2Data, 'line');
          initChart('chart3', data.chart3Data, 'line');
          initChart('donutChart', data.chart4Data, 'doughnut');
        })
        .catch(error => {
          console.error('Erro no upload:', error);
          alert('Erro ao processar o arquivo.');
        });
    }
  });
});

// chat
/*
var $messages = query('.messages-content'),
    d, h, m,
    i = 0;

    window.addEventListener('load', function () {
      const messagesContainer = document.querySelector('.mCSB_container');
      if (!messagesContainer) {
        console.error('Elemento .mCSB_container não encontrado');
        return; // Retorna caso o elemento não seja encontrado
      }
    
      // Lógica de rolagem para o final
      const messages = document.querySelector('.messages');
      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
    
      setTimeout(function () {
        fakeMessage(); // Chama a função para simular uma mensagem
      }, 100);
    });

    function fakeMessage() {
      const messageInput = document.querySelector('.message-input');
      if (messageInput && messageInput.value !== '') {
        return false;
      }
    
      // Cria a mensagem de "carregando"
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'message loading new';
      loadingMessage.innerHTML = `
        <figure class="avatar">
          <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" />
        </figure>
        <span></span>
      `;
      
      // Verifica se o container de mensagens existe antes de adicionar a nova mensagem
      const messagesContainer = document.querySelector('.mCSB_container');
      if (messagesContainer) {
        messagesContainer.appendChild(loadingMessage);
        updateScrollbar();
      } else {
        console.error('Elemento .mCSB_container não encontrado durante fakeMessage');
      }
    
      setTimeout(function () {
        loadingMessage.remove();
        const newFakeMessage = document.createElement('div');
        newFakeMessage.className = 'message new';
        newFakeMessage.innerHTML = `
          <figure class="avatar">
            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" />
          </figure>
          ${Fake[i]}
        `;
        if (messagesContainer) {
          messagesContainer.appendChild(newFakeMessage);
          newFakeMessage.classList.add('new');
          setDate();
          updateScrollbar();
        } else {
          console.error('Elemento .mCSB_container não encontrado ao adicionar a mensagem falsa');
        }
        i++;
      }, 1000 + (Math.random() * 20) * 100);
    }
    


// Função para rolar até o final da área de mensagens
function updateScrollbar() {
  const messages = document.querySelector('.messages');
  if (messages) {
    // Rola automaticamente para o final
    messages.scrollTop = messages.scrollHeight;
  }
}

function setDate() {
  const d = new Date();
  const m = d.getMinutes();
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  timestamp.textContent = `${d.getHours()}:${m}`;
  const lastMessage = document.querySelector('.message:last-child');
  if (lastMessage) {
    lastMessage.appendChild(timestamp);
  }
}

function insertMessage() {
  const msg = document.querySelector('.message-input').value;
  if (msg.trim() === '') {
    return false;
  }
  
  const newMessage = document.createElement('div');
  newMessage.className = 'message message-personal';
  newMessage.textContent = msg;
  document.querySelector('.mCSB_container').appendChild(newMessage);
  setDate();
  document.querySelector('.message-input').value = null;
  updateScrollbar();

  setTimeout(function () {
    fakeMessage();
  }, 1000 + (Math.random() * 20) * 100);
}

query('.message-submit').addEventListener('click', function () {
  insertMessage();
});

window.addEventListener('keydown', function (e) {
  if (e.which === 13) { // Código da tecla Enter
    insertMessage();
    return false; // Previne o comportamento padrão
  }
});

var Fake = [
  'Olá, como posso ajudar?',
  'Irei encaminhar um atendente para atender sua solicitação.',
  'Obrigado pela paciência!',
  'Aguarde um momento...',
  'Aguarde um momento...',
  'Aguarde um momento...',
  'Aguarde um momento...',
  'Aguarde um momento...',
  'Aguarde um momento...'
]

*/

