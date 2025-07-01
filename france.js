// Chargement des données
let wineData = [];

fetch('data/wine_data.json')
  .then(response => response.json())
  .then(data => {
    wineData = data;
    initializeCharts();
  });

let chart1, chart2; // Variables globales pour les graphiques

function initializeCharts() {
  // Filter data for France only
  const franceData = wineData.filter(item => item['Region/Country'] === 'France');

  // ========== PREMIER GRAPHIQUE (SCATTER AVEC LIGNES) ==========
  const ctx1 = document.getElementById('franceChart1').getContext('2d');
  
  // Group data by flux type
  const groupedData = franceData.reduce((acc, item) => {
    if (!acc[item.Flux]) acc[item.Flux] = [];
    acc[item.Flux].push(item);
    return acc;
  }, {});

  // Colors
  const colors = {
    'Consumption': 'rgba(153, 102, 255, 1)',
    'Exports': 'rgba(54, 162, 235, 1)',
    'Imports': 'rgb(79, 204, 99)',
    'Production': 'rgb(221, 170, 76)'
  };

  // Datasets for first chart
  const datasets1 = Object.keys(groupedData).map(flux => ({
    label: flux,
    data: groupedData[flux].map(item => ({
      x: item.Year,
      y: item.Quantity
    })),
    backgroundColor: colors[flux],
    borderColor: colors[flux],
    borderWidth: 2,
    pointRadius: 5,
    pointHoverRadius: 7,
    showLine: true,
    lineTension: 0.3
  }));

  // Vertical line plugin
  const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: function(chart) {
      if (chart.ctx.canvas.id !== 'franceChart1') return;
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const year = parseInt(document.getElementById('yearSlider').value);
      const xPos = xAxis.getPixelForValue(year);
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPos, yAxis.top);
      ctx.lineTo(xPos, yAxis.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(7, 23, 173)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
  };

  Chart.register(verticalLinePlugin);

  // Create first chart
  chart1 = new Chart(ctx1, {
    type: 'scatter',
    data: { datasets: datasets1 },
    options: firstChartOptions()
  });

  // ========== DEUXIÈME GRAPHIQUE (BARRES) ==========
  const ctx2 = document.getElementById('franceChart2').getContext('2d');
  
  // Prepare initial data for bar chart (year 2020 by default)
  const initialYear = 2020;
  const yearData = franceData.filter(item => item.Year === initialYear);
  
  // Create second chart
  chart2 = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: yearData.map(item => item.Flux),
      datasets: [{
        label: `Flux in ${initialYear}`,
        data: yearData.map(item => item.Quantity),
        backgroundColor: Object.values(colors),
        borderColor: Object.values(colors).map(c => c.replace('0.7', '1')),
        borderWidth: 1
      }]
    },
    options: secondChartOptions()
  });

  // ========== GESTION DU SLIDER ==========
  const yearSlider = document.getElementById('yearSlider');
  const selectedYearSpan = document.getElementById('selectedYear');

  yearSlider.addEventListener('input', function() {
    const year = parseInt(this.value);
    selectedYearSpan.textContent = year;
    
    // Update both charts
    chart1.update();
    updateBarChart(year);
  });

  function updateBarChart(year) {
    const yearData = franceData.filter(item => item.Year === year);
    
    chart2.data.labels = yearData.map(item => item.Flux);
    chart2.data.datasets[0].data = yearData.map(item => item.Quantity);
    chart2.data.datasets[0].label = `Flux in ${year}`;
    chart2.update();
  }
}

function firstChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: 'Year' },
        min: 1995,
        max: 2025,
        ticks: { stepSize: 1 }
      },
      y: {
        title: { display: true, text: 'Quantity (Million Hectoliter)' }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.y.toFixed(2)} million`;
          }
        }
      },
      legend: {
        position: 'top',
        labels: { padding: 20 }
      }
    }
  };
}

function secondChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 60,
        title: { display: true, text: 'Quantity (Million Hectoliter)' }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.raw.toFixed(2)} million hectoliter`;
          }
        }
      }
    }
  };
}