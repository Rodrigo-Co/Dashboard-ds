// Other important pens.
// Map: https://codepen.io/themustafaomar/pen/ZEGJeZq
// Navbar: https://codepen.io/themustafaomar/pen/VKbQyZ

'use strict'

function $(selector) {
  return document.querySelector(selector)
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
var slideNavDropdown = $('.sidebar-dropdown');

$('.sidebar .categories').addEventListener('click', function (event) {
  event.preventDefault()

  const item = event.target.closest('.has-dropdown')

  if (! item) {
    return
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
})

$('.sidebar .close-aside').addEventListener('click', function () {
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

let chart, chart2, myChartM, myChartD;
initCharts();

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
  if (chart3) {
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

function initCharts() {
  // The bar chart
  chart = new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: {
      labels: ["January", "February", "March", "April", 'May', 'June', 'August', 'September'],
      datasets: [{
        label: "Lost",
        data: [45, 25, 40, 20, 60, 20, 35, 25],
        backgroundColor: "#0d6efd",
        borderColor: 'transparent',
        borderWidth: 2.5,
        barPercentage: 0.4,
      }, {
        label: "Success",
        startAngle: 2,
        data: [20, 40, 20, 50, 25, 40, 25, 10],
        backgroundColor: "#dc3545",
        borderColor: 'transparent',
        borderWidth: 2.5,
        barPercentage: 0.4,
      }]
    },
    options: {
      legend: {
        display: true, // Exibe a legenda
        position: 'top', // Define a posição da legenda
        labels: {
          boxWidth: 20, // Define o tamanho da legenda
          fontSize: 14, // Define o tamanho da fonte da legenda
          padding: 10, // Define o espaçamento da legenda
          fontColor: '#FFF', // Cor do texto da legenda
          usePointStyle: false // Estilo de ponto (opcional)
        }
      },
      scales: {
        yAxes: [{
          gridLines: {},
          ticks: {
            stepSize: 15,
          },
        }],
        xAxes: [{
          gridLines: {
            display: false,
          }
        }]
      }
    }
  });
  
  // The line chart
  chart2 = new Chart(document.getElementById('myChart2'), {
    type: 'line',
    data: {
      labels: ["January", "February", "March", "April", 'May', 'June', 'August', 'September'],
      datasets: [{
        label: "My First dataset",
        data: [4, 20, 5, 20, 5, 25, 9, 18],
        backgroundColor: 'transparent',
        borderColor: '#0d6efd',
        lineTension: .4,
        borderWidth: 1.5,
      }, {
        label: "Month",
        data: [11, 25, 10, 25, 10, 30, 14, 23],
        backgroundColor: 'transparent',
        borderColor: '#dc3545',
        lineTension: .4,
        borderWidth: 1.5,
      }, {
        label: "Month",
        data: [16, 30, 16, 30, 16, 36, 21, 35],
        backgroundColor: 'transparent',
        borderColor: '#f0ad4e',
        lineTension: .4,
        borderWidth: 1.5,
      }]
    },
    options: {
      legend: {
        display: true, // Exibe a legenda
        position: 'top', // Define a posição da legenda
        labels: {
          boxWidth: 20, // Define o tamanho da legenda
          fontSize: 14, // Define o tamanho da fonte da legenda
          padding: 10, // Define o espaçamento da legenda
          fontColor: '#FFF', // Cor do texto da legenda
          usePointStyle: false // Estilo de ponto (opcional)
        }
      },
      scales: {
        yAxes: [{
          gridLines: {
            drawBorder: false
          },
          ticks: {
            stepSize: 12,
          }
        }],
        xAxes: [{
          gridLines: {
            display: false,
          },
        }]
      }
    }
  });
  
  
  myChartM =  new Chart(document.getElementById('chart3'), {
    type: 'line',
    data: {
      labels: ["One", "Two", "Three", "Four", "Five", 'Six', "Seven", "Eight"],
      datasets: [{
        label: "Red",
        lineTension: 0.2,
        borderColor: '#d9534f',
        borderWidth: 1.5,
        showLine: true,
        data: [1, 32, 19, 33, 18, 39, 20, 42, 20, 30],
        backgroundColor: 'transparent'
      }, {
        label: "Green",
        lineTension: 0.2,
        borderColor: '#5cb85c',
        borderWidth: 1.5,
        data: [6, 20, 5, 20, 5, 25, 9, 18, 20, 15],
        backgroundColor: 'transparent'
      },
                 {
                   label: "Yellow",
                   lineTension: 0.2,
                   borderColor: '#f0ad4e',
                   borderWidth: 1.5,
                   data: [12, 20, 15, 20, 5, 35, 10, 15, 35, 25],
                   backgroundColor: 'transparent'
                 },
                 {
                   label: "Blue",
                   lineTension: 0.2,
                   borderColor: '#337ab7',
                   borderWidth: 1.5,
                   data: [16, 25, 10, 25, 10, 30, 14, 23, 14, 29],
                   backgroundColor: 'transparent'
                 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    legend: {
      display: true, // Exibe a legenda
      position: 'top', // Define a posição da legenda
      labels: {
        boxWidth: 20, // Define o tamanho da legenda
        fontSize: 14, // Define o tamanho da fonte da legenda
        padding: 10, // Define o espaçamento da legenda
        fontColor: '#FFF', // Cor do texto da legenda
        usePointStyle: false // Estilo de ponto (opcional)
      }
    },
      scales: {
        yAxes: [{
          gridLines: {
            drawBorder: false
          },
          ticks: {
            stepSize: 12
          }
        }],
        xAxes: [{
          gridLines: {
            display: false,
          },
        }],
      }
    }
  });
  
  myChartD = new Chart(document.getElementById('donutChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          legend: {
          display: true, // Exibe a legenda
          position: 'top', // Define a posição da legenda
          labels: {
          boxWidth: 20, // Define o tamanho da legenda
          fontSize: 14, // Define o tamanho da fonte da legenda
          padding: 15, // Define o espaçamento da legenda
          fontColor: '#FFF', // Cor do texto da legenda
          usePointStyle: true // Estilo de ponto (opcional)
      }
    },
        }
      });
  
}
