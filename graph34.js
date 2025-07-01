// Graphe comparatif par âge — consommation en litres 2019 vs 2022

fetch("data/age_consumption_inLiterFR.json")
  .then(res => res.json())
  .then(data => {
    const labels = data.map(d => d.Age);            // ["-35", "35-49", "50-64", "65"]
    const values2019 = data.map(d => d["2019"]);
    const values2022 = data.map(d => d["2022"]);

    const ctx = document.getElementById("franceChart3").getContext("2d");

    // Charger les icônes raisin
    const ageIcons = [
      new Image(),
      new Image(),
      new Image(),
      new Image()
    ];
    ageIcons[0].src = "assets/raisin1.png";
    ageIcons[1].src = "assets/raisin2.png";
    ageIcons[2].src = "assets/raisin3.png";
    ageIcons[3].src = "assets/raisin4.png";

    // Texture bois pour 2019
    const img = new Image();
    img.src = "assets/bois-texture.jpg";

    img.onload = () => {
      const boisTexture = ctx.createPattern(img, "repeat");

      const chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "2019",
              data: values2019,
              backgroundColor: boisTexture,
              borderWidth: 1
            },
            {
              label: "2022",
              data: values2022,
              backgroundColor: "#f5c542",
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
                title: {
                display: true,
                text: "Age"
              },
              ticks: {
                display: true,
                padding: 40, // espace pour icône en dessous
                font: {
                  weight: 'bold'
                }
              },
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              max: 50,
              title: {
                display: true,
                text: "Liter per person / Year"
              },
              ticks: {
                stepSize: 10
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: context => `${context.dataset.label}: ${context.raw} L/an`
              }
            }
          }
        },
        plugins: [{
          id: "xAxisIcons",
          afterDraw: chart => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;

            chart.data.labels.forEach((label, i) => {
              const x = xAxis.getPixelForTick(i);
              const y = yAxis.bottom + 10;
              const icon = ageIcons[i];

              if (icon.complete) {
                ctx.drawImage(icon, x - 16, y, 32, 32);
              } else {
                icon.onload = () => {
                  ctx.drawImage(icon, x - 16, y, 32, 32);
                };
              }
            });
          }
        }]
      });

      // Resize dynamique
      window.addEventListener("resize", () => chart.resize());
    };
  });

  /*________________________________________________________________________________*/
let data;

fetch("data/Gender_consumption_difference.json")
  .then((res) => res.json())
  .then((json) => {
  data = json;
  const defaultYear = +document.getElementById("yearSlider2").value;
  document.getElementById("yearLabel2").textContent = defaultYear;
  updateGlasses(defaultYear);
});

document.getElementById("yearSlider2").addEventListener("input", (e) => {
  const year = +e.target.value;
  document.getElementById("yearLabel2").textContent = year;
  updateGlasses(year);
});

function updateGlasses(year) {
  const entry = data.find((d) => d.Year === year);
  if (!entry) return; // sécurise
  updateWine("wave-female", "label-female", entry.Women);
  updateWine("wave-male", "label-male", entry.Men);
}

let glouAllowed = false;
document.body.addEventListener('click', () => {
  glouAllowed = true;
});

function updateWine(waveId, labelId, percent) {
  const wavePath = document.getElementById(waveId);
  const label = document.getElementById(labelId);
  const audio = document.getElementById("glouSound");

  let height = 40 - (percent * 0.4);;
  let amplitude = 10;
  let frequency = 2;

  let d = `M 0 ${height}`;
  for (let x = 0; x <= 20; x += 2) {
    const y = height + amplitude * Math.sin((x / 100) * frequency * 1 * Math.PI);
    d += ` L ${x} ${y}`;
  }
  d += ` L 20 40 L 0 40 Z`;

  wavePath.setAttribute("d", d);
  label.textContent = `${percent}%`;

  if (glouAllowed) {
    audio.currentTime = 0;
    audio.play().catch(() => {}); // évite nouvelle erreur si refusé
  }
}
