import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('wineCanvas');
const checkContainer = document.getElementById('country-checkboxes');
const yearSlider = document.getElementById('yearSlider');
const yearLabel = document.getElementById('yearLabel');

let selectedFlux = "Consumption"; // Valeur par défaut

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);


const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 50;

scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// Base au sol
const baseGeometry = new THREE.CylinderGeometry(11.5, 11.5, 0.5, 64); // 👈 0.5 = hauteur de la base
const baseMaterial = new THREE.MeshStandardMaterial({
  color: 0xdbcfd6,
  roughness: 0.8,
  metalness: 0.1
});
const base = new THREE.Mesh(baseGeometry, baseMaterial);
base.position.y = -0.45; // moitié sous zéro pour que le haut soit à Y = 0
scene.add(base);

// Bouteille de vin
const axisPoints = [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 8, 0) ];
// 🍷 Corps de la bouteille
const bottleBody = new THREE.Mesh(
  new THREE.CylinderGeometry(1.7, 1.7, 8, 24),
  new THREE.MeshStandardMaterial({ color: 0x5b103d, roughness: 0.5 })
);
bottleBody.position.y = 3.5; // pour que le fond touche le sol
scene.add(bottleBody);

// 🟤 Goulot de la bouteille
const bottleNeck = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.45, 1, 12),
  new THREE.MeshStandardMaterial({ color: 0x3d0b1c })
);
bottleNeck.position.y = 8; // sur le dessus du corps
scene.add(bottleNeck);

// 🟥 Bouchon stylisé
const cork = new THREE.Mesh(
  new THREE.CylinderGeometry(0.48, 0.48, 0.4, 180),
  new THREE.MeshStandardMaterial({ color: 0x944f28, roughness: 0.9 })
);
cork.position.y = 8.7;
scene.add(cork);
// 📛 Étiquette plane
const labelGeometry = new THREE.CylinderGeometry(1.705, 1.705, 3, 32, 1, true, -Math.PI / 4, Math.PI / 2);
//                                                ↑ rayon ~ légèrement plus grand que la bouteille (0.4), pour ne pas la clipper
//                                                        ↑ hauteur de l'étiquette
//                                                                  ↑ segment d’arc (90° ici, ajustable)

const labelMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide
});

const canvasLabel = document.createElement('canvas');
canvasLabel.width = 512;
canvasLabel.height = 256;

const ctx = canvasLabel.getContext('2d');

// Fond de l’étiquette
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvasLabel.width, canvasLabel.height);

// Titre principal
ctx.fillStyle = '#3b0b2e';
ctx.font = 'bold 64px "Georgia", serif';
ctx.textAlign = 'center';
ctx.fillText('World Wide', canvasLabel.width / 2, canvasLabel.height / 2 - 20);

// Sous-titre de couleur différente
ctx.fillStyle = '#9a6c2f'; // doré/brun clair
ctx.font = 'italic 72px "Georgia", serif';
ctx.fillText('World Wine', canvasLabel.width / 2, canvasLabel.height / 2 + 40);

// Sous-titre de couleur différente
ctx.fillStyle = '#a31d69';
ctx.font = 'italic 48px "Georgia", serif';
ctx.fillText('2025', canvasLabel.width / 2, canvasLabel.height / 2 + 100);

// Création de la texture
const texture = new THREE.CanvasTexture(canvasLabel);
labelMaterial.map = texture;
labelMaterial.needsUpdate = true;



const label = new THREE.Mesh(labelGeometry, labelMaterial);
label.rotation.x = 0;           // redresse la bande verticalement
label.rotation.z = 0;                     // en face avant
label.position.y = 4.3;                   // hauteur sur le corps de bouteille
scene.add(label);
/*____________________________________________________________________________ */


let bubbles = [];
let rawData = [];

fetch("data/wine_data.json")
  .then(res => res.json())
  .then(raw => {
    // 🔁 Normalisation des clés
    rawData = raw.map(d => ({
      continent: d.Continent,
      country: d["Region/Country"],
      flux: d.Flux,
      year: Number(d.Year),
      quantity: parseFloat(d.Quantity)
    }));

    // 📌 Map pays → continent
    const countryToContinent = {};
    rawData.forEach(d => {
      if (!countryToContinent[d.country]) {
        countryToContinent[d.country] = d.continent;
      }
    });

    
    // ➕ Création des sphères
    const uniqueCountries = Object.keys(countryToContinent).sort((a, b) => {
      return countryToContinent[a].localeCompare(countryToContinent[b]);
    });
    const angleStep = (2 * Math.PI) / uniqueCountries.length;

    let previousContinent = null;
    const continentDividers = {};

    
    uniqueCountries.forEach((country, i) => {
      const angle = i * angleStep;
      const radius = 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const continent = countryToContinent[country];

      // 🎯 Insertion d'une barre si on change de continent
      if (previousContinent !== null && continent !== previousContinent) {
        const barHeight = 4;
        const barGeometry = new THREE.PlaneGeometry(0.1, barHeight);
        const barMaterial = new THREE.MeshBasicMaterial({
          color: 0x0000000,
          opacity: 0.85,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(x, barHeight / 2.5, z);
        bar.lookAt(0, barHeight / 2, 0); // optionnel : orienter vers le centre
        scene.add(bar);
      
        // 🔒 Stocker si tu veux les activer/désactiver plus tard
        if (!continentDividers[previousContinent]) continentDividers[previousContinent] = [];
        continentDividers[previousContinent].push(bar);
      }

      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8e44ad,
        transparent: true,
        opacity: 0.85,
        depthWrite: false // 👈 essentiel pour laisser passer les Sprites
      });

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, 1, z);
      sphere.userData = {
        country,
        continent: countryToContinent[country],
        visible: true,
        targetY: 1,
        scaleY: 1,
        fadeOut: false,
        checkboxVisible: true,
        drip: null
      };
      sphere.userData.drip = new DripManager(scene, sphere, 0.5);
      // Texte des litres (au centre de la bulle)
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 128;
      labelCanvas.height = 64;
      const labelCtx = labelCanvas.getContext("2d");

      labelCtx.fillStyle = "#a470c4";
      labelCtx.font = "bold 20px sans-serif";
      labelCtx.textAlign = "center";
      labelCtx.fillText("0.0 L", 64, 40);

      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.85
      });
      const labelSprite = new THREE.Sprite(labelMaterial);
      labelSprite.scale.set(2, 1, 1);
      labelSprite.position.set(0, 0, 0); // 👈 bien au centre

      sphere.add(labelSprite);
      sphere.userData.label = {
        canvas: labelCanvas,
        ctx: labelCtx,
        sprite: labelSprite,
        texture: labelTexture
      };
      //Texte des pays au dessus de la bulle
      const nameCanvas = document.createElement("canvas");
      nameCanvas.width = 256;
      nameCanvas.height = 64;
      const nameCtx = nameCanvas.getContext("2d");
          
      nameCtx.fillStyle = "#3a9c41";
      nameCtx.font = "bold 18px sans-serif";
      nameCtx.textAlign = "center";
      nameCtx.fillText(country, 128, 40); // 👈 nom du pays
          
      const nameTexture = new THREE.CanvasTexture(nameCanvas);
      const nameMaterial = new THREE.SpriteMaterial({
        map: nameTexture,
        transparent: true,
        depthWrite: false
      });
      const nameSprite = new THREE.Sprite(nameMaterial);
      nameSprite.scale.set(4, 1.2, 1);
      nameSprite.position.set(0, 0.9, 0); // juste au-dessus de la sphère
      
      sphere.add(nameSprite);
      sphere.userData.nameLabel = nameSprite;

      scene.add(sphere);
      bubbles.push(sphere);
      previousContinent = countryToContinent[country];
      if (continent) {
        previousContinent = continent;
      }
    });

    generateCheckboxesGroupedByContinent(); // ✅ Interface maintenant compatible avec les clés corrigées
    updateBubblesForYear(Number(yearSlider.value));
    animate();
    createGraduatedRuler(scene); 
    document.getElementById("toggleDividers").addEventListener("change", e => {
      const visible = e.target.checked;
        
      Object.values(continentDividers).forEach(barList => {
        barList.forEach(bar => {
          bar.visible = visible;
        
          // 👇 Si tu as un label texte accroché à la barre
          bar.children?.forEach(child => child.visible = visible);
        });
      });
    });
  });

  

function createGraduatedRuler(scene, maxValue = 30, height = 17.8, xPos = 11.5, yOffset = -0.2, zPos = 0) {
  const rulerGroup = new THREE.Group();

  // 🟣 1. Axe vertical
  const rulerGeometry = new THREE.PlaneGeometry(0.05, height);
  const rulerMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });
  const ruler = new THREE.Mesh(rulerGeometry, rulerMaterial);
  ruler.position.set(xPos, height / 2 + yOffset, zPos);
  rulerGroup.add(ruler);

  // 🔘 2. Ticks & Labels
  const tickInterval = 2; // tous les 2 litres
  for (let litres = 0; litres <= maxValue; litres += tickInterval) {
    const y = (litres / maxValue) * height;

    // Tick
    const tickGeometry = new THREE.PlaneGeometry(0.3, 0.01);
    const tickMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const tickMesh = new THREE.Mesh(tickGeometry, tickMaterial);
    tickMesh.position.set(xPos, y + yOffset - 0.005, zPos);
    rulerGroup.add(tickMesh);

    // Label
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#333";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${litres} L`, 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(2, 0.8, 1);
    label.position.set(xPos + 0.4, y + yOffset - 0.05, zPos);
    rulerGroup.add(label);
  }

  scene.add(rulerGroup);
  return rulerGroup;
}


yearSlider.addEventListener("input", () => {
  const year = Number(yearSlider.value);
  yearLabel.textContent = year;
  updateBubblesForYear(year);
  sortCheckboxUIByContinentTotal(year);

  const activeCountries = bubbles
  .filter(b => b.visible)
  .map(b => b.userData.country);
});

const fluxSelector = document.getElementById("fluxSelector");
fluxSelector.addEventListener("change", (e) => {
  selectedFlux = e.target.value;
  updateBubblesForYear(Number(yearSlider.value));
  sortCheckboxUIByContinentTotal(yearSlider.value);
});

function updateBubblesForYear(year) {
  const yearData = rawData.filter(d => d.flux === selectedFlux && d.year === year);
  const maxValue = Math.max(...yearData.map(d => d.quantity)) || 1;

  // 🎨 Choix de couleur selon le flux
  let targetColor = 0x8e44ad; // consommation = violet
  if (selectedFlux === "Imports") targetColor = 0x27ae60;  // vert
  else if (selectedFlux === "Exports") targetColor = 0x2980b9; // bleu
  else if (selectedFlux === "Production") targetColor = 0xe67e22; // orange

  bubbles.forEach(sphere => {
    const entry = yearData.find(d => d.country === sphere.userData.country);

    // 🔒 Si la case du pays est décochée
    if (!sphere.userData.checkboxVisible) {
      sphere.visible = false;
      return;
    }

    sphere.visible = true;

    // 🔻 Cas sans donnée ou quantité nulle
    if (!entry || entry.quantity === 0) {
      sphere.userData.targetY = 0.1;
      sphere.userData.scaleY = 0.2;
      sphere.userData.fadeOut = true;
      if (sphere.userData.drip) sphere.userData.drip.intensity = 0;
    } else {
      const yScale = entry.quantity / maxValue;

      sphere.userData.targetY = yScale * 20;
      sphere.userData.scaleY = 1;
      sphere.userData.fadeOut = false;
      if (sphere.userData.drip) sphere.userData.drip.intensity = yScale;
    }

    // 🎨 Appliquer couleur
    if (sphere.material && sphere.material.color) {
      sphere.material.color.setHex(targetColor);
    }
    //mise a jour du texte au centre
    if (sphere.userData.label) {
      const { ctx, texture } = sphere.userData.label;
      ctx.clearRect(0, 0, 128, 64);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center"    ;
        
      if (!entry || entry.quantity === 0) {
        ctx.fillText("0.0 ", 64, 40);
      } else {
        ctx.fillText(`${entry.quantity.toFixed(1)} `, 64, 40);
          }
      
      texture.needsUpdate = true;
    }

    if (sphere.userData.label?.sprite) {
      sphere.userData.label.sprite.visible = sphere.visible;
    }
    if (sphere.userData.nameLabel) {
      sphere.userData.nameLabel.visible = sphere.visible;
    }


  });

  updateLegend(year);
}


function updateLegend(year) {
  const list = document.getElementById("legendList");
  const panel = document.getElementById("legendPanel");

  list.innerHTML = "";

  // 🎯 Met à jour le titre selon le flux
  let title = "Legend";
  if (selectedFlux === "Imports") title = "Imports";
  else if (selectedFlux === "Exports") title = "Exports";
  else if (selectedFlux === "Production") title = "Production";
  else title = "Consumption";

  panel.querySelector("h3").textContent = `${title} ${year} (Million Hecto Liter)`;

  // 🔍 Filtrer les données actives (flux + année)
  const filtered = rawData.filter(d => d.flux === selectedFlux && d.year === year);

  // 🧪 Ne garder que les pays cochés
  const visibleCountries = new Set(
    bubbles
      .filter(b => b.userData.checkboxVisible)
      .map(b => b.userData.country)
  );

  // 🧮 Somme des valeurs par pays sélectionné
  const byCountry = {};

  filtered.forEach(d => {
    if (!visibleCountries.has(d.country)) return; // ignorer pays décochés
    if (!byCountry[d.country]) byCountry[d.country] = 0;
    byCountry[d.country] += d.quantity;
  });

  const entries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);

  // 📝 Remplir la légende
  entries.forEach(([country, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${country}</span><strong>${value.toFixed(2)} </strong>`;
    list.appendChild(li);
  });
}




function generateCheckboxesGroupedByContinent() {
  const groups = {};

  bubbles.forEach(b => {
    const cont = b.userData.continent;
    if (!groups[cont]) groups[cont] = new Set();
    groups[cont].add(b.userData.country);
  });

  checkContainer.innerHTML = '';

  Object.keys(groups).sort().forEach(continent => {
    const section = document.createElement("div");
    section.classList.add("continent-group");

    const title = document.createElement("h4");
    title.innerHTML = `<button class="toggle-group">▼</button> ${continent}`;
    section.appendChild(title);

    const innerList = document.createElement("div");
    innerList.classList.add("country-list", "collapsed");
    section.appendChild(innerList);

    // 👇 bouton de repli
    title.querySelector(".toggle-group").addEventListener("click", (e) => {
      innerList.classList.toggle("collapsed");
      e.target.textContent = innerList.classList.contains("collapsed") ? '▶' : '▼';
    });

    [...groups[continent]].sort().forEach(country => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" checked data-country="${country}"> ${country}`;
      innerList.appendChild(label); // ✅ correction ici

      label.querySelector("input").addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        bubbles.forEach(b => {
          if (b.userData.country === country) {
            b.userData.checkboxVisible = isChecked;
            b.visible = isChecked;
          }
        });
        updateBubblesForYear(Number(yearSlider.value));
      });
    });

    checkContainer.appendChild(section);
  });
}


// 🔄 Tri des groupes visuels par total de consommation
function sortCheckboxUIByContinentTotal(year) {
  const yearData = rawData.filter(d => d.year === year && d.flux === "Consumption");
  const totalPerContinent = {};

  yearData.forEach(d => {
    totalPerContinent[d.continent] = (totalPerContinent[d.continent] || 0) + d.quantity;
  });

  const sections = [...checkContainer.children];
  sections.sort((a, b) => {
    const aCont = a.querySelector('h4')?.textContent.split(' ')[1];
    const bCont = b.querySelector('h4')?.textContent.split(' ')[1];
    return (totalPerContinent[bCont] || 0) - (totalPerContinent[aCont] || 0);
  });

  sections.forEach(s => checkContainer.appendChild(s));
}

// 💧 DripManager (inchangé)
class DripManager {
  constructor(scene, sphere, intensity = 0.5) {
    this.scene = scene;
    this.sphere = sphere;
    this.gouttes = [];
    this.timer = 0;
    this.intensity = intensity;
  }

  update(deltaTime) {
    this.timer -= deltaTime;
    if (this.timer <= 0) {
      if (this.intensity > 0 && this.sphere.visible && !this.sphere.userData.fadeOut) {
        this.spawnDrip();
      }
      this.timer = 2 + Math.random() * (4 - this.intensity * 3);
    }

    for (let i = this.gouttes.length - 1; i >= 0; i--) {
      const d = this.gouttes[i];
      if (!d || !d.material || !d.mesh) {
        this.gouttes.splice(i, 1); // 🧼 on nettoie les entrées cassées
        continue;
      }

      d.mesh.position.y -= 0.03;
      d.material.opacity -= 0.01;

      if (d.material.opacity <= 0) {
        this.scene.remove(d.mesh);
        this.gouttes.splice(i, 1);
      }
    }
  }

  spawnDrip() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x5b103d,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.1
    });
    const geom = new THREE.SphereGeometry(0.07, 12, 12);
    const drip = new THREE.Mesh(geom, mat);
    const origin = this.sphere.position.clone();
    drip.position.set(origin.x, origin.y - 0.6, origin.z);
    this.scene.add(drip);
    this.gouttes.push({ mesh: this.scene.add(drip)});
    this.gouttes.push({ mesh: drip, material: mat });
  }
}

function animate() {
  requestAnimationFrame(animate);
  const perfNow = performance.now();
  const deltaTime = 0.016;

  bubbles.forEach((sphere, i) => {
    const tY = sphere.userData.targetY ?? sphere.position.y;
    const dy = tY - sphere.position.y;
    sphere.position.y += dy * 0.08;
    sphere.position.y += Math.sin(dy * 5) * 0.01;

    sphere.userData.drip.update(deltaTime);

    let scaleY = sphere.scale.y;
    const targetScaleY = sphere.userData.scaleY ?? 1;
    scaleY += (targetScaleY - scaleY) * 0.1;
    sphere.scale.y = scaleY;
    sphere.scale.x = sphere.scale.z = 1 + (1 - scaleY) * 0.5;

    const mat = sphere.material;
    if (sphere.userData.fadeOut) {
      mat.opacity -= 0.03;
      if (mat.opacity <= 0.05) {
        sphere.visible = false;
        mat.opacity = 0;
      }
    } else {
      if (sphere.userData.checkboxVisible) {
        sphere.visible = true;
        mat.opacity += (0.85 - mat.opacity) * 0.1;
      }
    }

    const floatOffset = Math.sin(perfNow * 0.001 + i * 1.7) * 0.01;
    sphere.position.y += floatOffset;
  });

  controls.update();
  renderer.render(scene, camera);
}

document.getElementById("activateAll").addEventListener("click", () => {
  const checkboxes = checkContainer.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = true;
    const country = cb.dataset.country;
    bubbles.forEach(b => {
      if (b.userData.country === country) {
        b.userData.checkboxVisible = true;
        b.visible = true;
      }
    });
  });
  updateBubblesForYear(Number(yearSlider.value));
});

document.getElementById("deactivateAll").addEventListener("click", () => {
  const checkboxes = checkContainer.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = false;
    const country = cb.dataset.country;
    bubbles.forEach(b => {
      if (b.userData.country === country) {
        b.userData.checkboxVisible = false;
        b.visible = false;
      }
    });
  });
  updateBubblesForYear(Number(yearSlider.value));
});

const toggleBtn = document.getElementById("toggleFilters");
const filtersPanel = document.getElementById("filtersPanel");

toggleBtn.addEventListener("click", () => {
  filtersPanel.classList.toggle("hidden");
});

const legend = document.getElementById("floating-legend");
let isDragging = false, offset = { x: 0, y: 0 };

legend.addEventListener("mousedown", e => {
  isDragging = true;
  offset.x = e.clientX - legend.offsetLeft;
  offset.y = e.clientY - legend.offsetTop;
});
document.addEventListener("mouseup", () => isDragging = false);
document.addEventListener("mousemove", e => {
  if (!isDragging) return;
  legend.style.left = `${e.clientX - offset.x}px`;
  legend.style.top = `${e.clientY - offset.y}px`;
});


document.querySelectorAll("#imageToggles input[type='checkbox']").forEach(cb => {
  cb.addEventListener("change", e => {
    const id = e.target.dataset.img;
    const div = document.getElementById(id);
    if (div) {
      div.classList.toggle("hidden", !e.target.checked);
    }
  });
});

// 🎯 Drag & Drop léger
document.querySelectorAll(".floating-image").forEach(el => {
  let offset = { x: 0, y: 0 };
  let isDragging = false;

  el.addEventListener("mousedown", e => {
    isDragging = true;
    offset.x = e.clientX - el.offsetLeft;
    offset.y = e.clientY - el.offsetTop;
    el.style.zIndex = 999;
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offset.x}px`;
    el.style.top = `${e.clientY - offset.y}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
});

const bgCheckbox = document.getElementById("toggleBackground");
bgCheckbox.checked = false; // ✅ fond beige par défaut

bgCheckbox.addEventListener("change", e => {
  document.body.classList.toggle("has-background", e.target.checked);
});