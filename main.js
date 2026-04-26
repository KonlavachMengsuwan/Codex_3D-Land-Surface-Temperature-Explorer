import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Land cover settings. Edit the offsets here to change how each type warms or cools.
const LAND_COVER = {
  water: {
    label: "Water",
    offset: -3.0,
    sunFactor: 0.35,
    humidityFactor: 1.2,
    coolingPower: 1.15,
    baseHeight: 0.08,
  },
  forest: {
    label: "Forest",
    offset: -2.5,
    sunFactor: 0.48,
    humidityFactor: 1.1,
    coolingPower: 0.95,
    baseHeight: 0.18,
  },
  trees: {
    label: "Trees",
    offset: -2.0,
    sunFactor: 0.55,
    humidityFactor: 1.0,
    coolingPower: 0.75,
    baseHeight: 0.16,
  },
  agriculture: {
    label: "Agriculture Field",
    offset: -1.0,
    sunFactor: 0.78,
    humidityFactor: 0.9,
    coolingPower: 0.25,
    baseHeight: 0.12,
  },
  grass: {
    label: "Grass/Open Land",
    offset: 0.0,
    sunFactor: 0.9,
    humidityFactor: 0.85,
    coolingPower: 0.2,
    baseHeight: 0.1,
  },
  building: {
    label: "Buildings/Urban Area",
    offset: 2.5,
    sunFactor: 1.05,
    humidityFactor: 0.65,
    coolingPower: 0,
    baseHeight: 0.14,
  },
  paved: {
    label: "Road/Paved Surface",
    offset: 3.5,
    sunFactor: 1.15,
    humidityFactor: 0.55,
    coolingPower: 0,
    baseHeight: 0.09,
  },
};

// A small hand-built landscape. Each entry becomes one 3D cell.
const LANDSCAPE = [
  ["forest", "forest", "trees", "grass", "agriculture", "agriculture", "agriculture", "grass", "paved", "building", "building", "building"],
  ["forest", "forest", "trees", "grass", "agriculture", "agriculture", "agriculture", "grass", "paved", "building", "building", "building"],
  ["forest", "trees", "trees", "grass", "grass", "agriculture", "agriculture", "grass", "paved", "paved", "building", "building"],
  ["water", "water", "trees", "grass", "grass", "agriculture", "agriculture", "grass", "grass", "paved", "paved", "building"],
  ["water", "water", "water", "trees", "grass", "grass", "agriculture", "agriculture", "grass", "grass", "paved", "building"],
  ["water", "water", "water", "trees", "grass", "grass", "agriculture", "agriculture", "agriculture", "grass", "paved", "paved"],
  ["water", "water", "trees", "trees", "grass", "agriculture", "agriculture", "agriculture", "agriculture", "grass", "grass", "paved"],
  ["forest", "trees", "trees", "grass", "grass", "agriculture", "agriculture", "agriculture", "grass", "grass", "grass", "paved"],
  ["forest", "forest", "trees", "grass", "grass", "grass", "agriculture", "grass", "grass", "trees", "trees", "grass"],
  ["forest", "forest", "forest", "trees", "grass", "grass", "grass", "grass", "trees", "trees", "forest", "forest"],
  ["forest", "forest", "forest", "trees", "trees", "grass", "grass", "trees", "trees", "forest", "forest", "forest"],
  ["forest", "forest", "forest", "forest", "trees", "trees", "grass", "trees", "forest", "forest", "forest", "forest"],
];

const CELL_SIZE = 1;
const ROWS = LANDSCAPE.length;
const COLS = LANDSCAPE[0].length;
const COOLING_TYPES = new Set(["water", "forest", "trees"]);

const sceneEl = document.querySelector("#scene");
const tooltipEl = document.querySelector("#tooltip");
const inputs = {
  airTemp: document.querySelector("#airTemp"),
  sunIntensity: document.querySelector("#sunIntensity"),
  humidity: document.querySelector("#humidity"),
};
const readouts = {
  airTemp: document.querySelector("#airTempValue"),
  sunIntensity: document.querySelector("#sunIntensityValue"),
  humidity: document.querySelector("#humidityValue"),
  minTemp: document.querySelector("#minTemp"),
  maxTemp: document.querySelector("#maxTemp"),
  legendMin: document.querySelector("#legendMin"),
  legendMax: document.querySelector("#legendMax"),
  cellCover: document.querySelector("#cellCover"),
  cellTemp: document.querySelector("#cellTemp"),
};

const tileMeshes = [];
const interactiveObjects = [];
let temperatures = [];
let hoveredCell = null;
let selectedCell = null;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
renderer.shadowMap.enabled = true;
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc8d7df);

const camera = new THREE.PerspectiveCamera(45, sceneEl.clientWidth / sceneEl.clientHeight, 0.1, 100);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.47;
configureCameraForViewport();

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x6f7f7b, 1.35);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
sunLight.position.set(-5, 9, 4);
sunLight.castShadow = true;
scene.add(sunLight);

const mapGroup = new THREE.Group();
scene.add(mapGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const hoverHighlight = createHighlight(0xffffff);
const selectedHighlight = createHighlight(0xfff4a3);
scene.add(hoverHighlight, selectedHighlight);

buildLandscape();
updateSimulation();
animate();

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", updateSimulation);
});

renderer.domElement.addEventListener("pointermove", handlePointerMove);
renderer.domElement.addEventListener("pointerleave", clearHover);
renderer.domElement.addEventListener("click", handleCanvasClick);

window.addEventListener("resize", handleResize);

function buildLandscape() {
  const centerX = (COLS - 1) * CELL_SIZE * 0.5;
  const centerZ = (ROWS - 1) * CELL_SIZE * 0.5;

  for (let row = 0; row < ROWS; row += 1) {
    tileMeshes[row] = [];

    for (let col = 0; col < COLS; col += 1) {
      const type = LANDSCAPE[row][col];
      const cover = LAND_COVER[type];
      const x = col * CELL_SIZE - centerX;
      const z = row * CELL_SIZE - centerZ;

      const geometry = new THREE.BoxGeometry(CELL_SIZE * 0.96, cover.baseHeight, CELL_SIZE * 0.96);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.72,
        metalness: 0.02,
      });

      const tile = new THREE.Mesh(geometry, material);
      tile.position.set(x, cover.baseHeight * 0.5, z);
      tile.castShadow = false;
      tile.receiveShadow = true;
      tile.userData = { row, col, type, isCell: true };

      mapGroup.add(tile);
      tileMeshes[row][col] = tile;
      interactiveObjects.push(tile);

      addLandCoverDetails(type, x, z, cover.baseHeight, row, col);
    }
  }

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(COLS + 0.8, 0.12, ROWS + 0.8),
    new THREE.MeshStandardMaterial({ color: 0x6b7f77, roughness: 0.9 })
  );
  base.position.y = -0.09;
  base.receiveShadow = true;
  mapGroup.add(base);
}

function addLandCoverDetails(type, x, z, baseHeight, row, col) {
  if (type === "building") {
    const height = 0.65 + ((row + col) % 3) * 0.28;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, height, 0.56),
      new THREE.MeshStandardMaterial({ color: 0x9ca5a8, roughness: 0.65 })
    );
    building.position.set(x, baseHeight + height * 0.5, z);
    building.castShadow = true;
    building.receiveShadow = true;
    attachCellData(building, row, col, type);
    mapGroup.add(building);
    interactiveObjects.push(building);
  }

  if (type === "forest" || type === "trees") {
    const count = type === "forest" ? 3 : 2;
    for (let i = 0; i < count; i += 1) {
      const offsetX = ((i % 2) - 0.5) * 0.42;
      const offsetZ = (Math.floor(i / 2) - 0.35) * 0.34;
      addTree(x + offsetX, z + offsetZ, baseHeight, row, col, type);
    }
  }

  if (type === "agriculture") {
    const cropMaterial = new THREE.MeshStandardMaterial({ color: 0x5b9b55, roughness: 0.8 });
    for (let i = -1; i <= 1; i += 1) {
      const cropRow = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, 0.055), cropMaterial);
      cropRow.position.set(x, baseHeight + 0.035, z + i * 0.22);
      cropRow.castShadow = false;
      attachCellData(cropRow, row, col, type);
      mapGroup.add(cropRow);
      interactiveObjects.push(cropRow);
    }
  }

  if (type === "paved") {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.018, 0.66),
      new THREE.MeshStandardMaterial({ color: 0xf4f0c8, roughness: 0.7 })
    );
    stripe.position.set(x, baseHeight + 0.03, z);
    attachCellData(stripe, row, col, type);
    mapGroup.add(stripe);
    interactiveObjects.push(stripe);
  }
}

function addTree(x, z, baseHeight, row, col, type) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.28, 6),
    new THREE.MeshStandardMaterial({ color: 0x775238, roughness: 0.9 })
  );
  trunk.position.set(x, baseHeight + 0.14, z);
  trunk.castShadow = true;
  attachCellData(trunk, row, col, type);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.42, 7),
    new THREE.MeshStandardMaterial({ color: type === "forest" ? 0x1f6e42 : 0x2d8a4e, roughness: 0.82 })
  );
  canopy.position.set(x, baseHeight + 0.48, z);
  canopy.castShadow = true;
  attachCellData(canopy, row, col, type);

  mapGroup.add(trunk, canopy);
  interactiveObjects.push(trunk, canopy);
}

function attachCellData(object, row, col, type) {
  object.userData = { row, col, type, isCellDetail: true };
}

function updateSimulation() {
  const settings = getSettings();

  readouts.airTemp.textContent = `${settings.airTemp} C`;
  readouts.sunIntensity.textContent = `${settings.sunIntensity}%`;
  readouts.humidity.textContent = `${settings.humidity}%`;
  sunLight.intensity = 0.55 + settings.sunIntensity / 40;

  temperatures = calculateTemperatures(settings);
  const flatTemps = temperatures.flat();
  const minTemp = Math.min(...flatTemps);
  const maxTemp = Math.max(...flatTemps);

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const temp = temperatures[row][col];
      const color = temperatureToColor(temp, minTemp, maxTemp);
      const tile = tileMeshes[row][col];
      tile.material.color.copy(color);
      tile.userData.temperature = temp;
    }
  }

  const minLabel = formatTemp(minTemp);
  const maxLabel = formatTemp(maxTemp);
  readouts.minTemp.textContent = minLabel;
  readouts.maxTemp.textContent = maxLabel;
  readouts.legendMin.textContent = minLabel;
  readouts.legendMax.textContent = maxLabel;

  if (selectedCell) {
    updateCellPanel(selectedCell);
  } else if (hoveredCell) {
    updateCellPanel(hoveredCell);
  }
}

function getSettings() {
  return {
    airTemp: Number(inputs.airTemp.value),
    sunIntensity: Number(inputs.sunIntensity.value),
    humidity: Number(inputs.humidity.value),
  };
}

function calculateTemperatures(settings) {
  return LANDSCAPE.map((row, rowIndex) =>
    row.map((type, colIndex) => calculateCellTemperature(type, rowIndex, colIndex, settings))
  );
}

function calculateCellTemperature(type, row, col, settings) {
  const cover = LAND_COVER[type];

  // Simplified educational rule:
  // LST = air temperature + land offset + sun effect - humidity effect + neighborhood effect.
  const sunEffect = (settings.sunIntensity / 100) * 7.0 * cover.sunFactor;
  const humidityEffect = (settings.humidity / 100) * 4.5 * cover.humidityFactor;
  const neighborhoodEffect = calculateNeighborhoodCooling(row, col);

  return settings.airTemp + cover.offset + sunEffect - humidityEffect + neighborhoodEffect;
}

function calculateNeighborhoodCooling(row, col) {
  let cooling = 0;

  for (let nearRow = row - 2; nearRow <= row + 2; nearRow += 1) {
    for (let nearCol = col - 2; nearCol <= col + 2; nearCol += 1) {
      if (!isInBounds(nearRow, nearCol) || (nearRow === row && nearCol === col)) {
        continue;
      }

      const nearType = LANDSCAPE[nearRow][nearCol];
      if (!COOLING_TYPES.has(nearType)) {
        continue;
      }

      const distance = Math.hypot(row - nearRow, col - nearCol);
      const neighbor = LAND_COVER[nearType];
      cooling -= neighbor.coolingPower / (distance + 0.35);
    }
  }

  return Math.max(cooling, -2.8);
}

function isInBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function temperatureToColor(temp, minTemp, maxTemp) {
  const range = Math.max(maxTemp - minTemp, 0.001);
  const t = THREE.MathUtils.clamp((temp - minTemp) / range, 0, 1);
  const stops = [
    { at: 0.0, color: new THREE.Color("#1e56ff") },
    { at: 0.22, color: new THREE.Color("#00d7ff") },
    { at: 0.42, color: new THREE.Color("#2ecf6f") },
    { at: 0.62, color: new THREE.Color("#ffd83d") },
    { at: 0.8, color: new THREE.Color("#ff8d28") },
    { at: 1.0, color: new THREE.Color("#d71f1f") },
  ];

  for (let i = 1; i < stops.length; i += 1) {
    const previous = stops[i - 1];
    const next = stops[i];
    if (t <= next.at) {
      const localT = (t - previous.at) / (next.at - previous.at);
      return previous.color.clone().lerp(next.color, localT);
    }
  }

  return stops[stops.length - 1].color.clone();
}

function handlePointerMove(event) {
  hoveredCell = pickCellFromEvent(event);

  if (!hoveredCell) {
    clearHover();
    return;
  }

  moveHighlight(hoverHighlight, hoveredCell);
  updateCellPanel(hoveredCell);
  showTooltip(event, hoveredCell);
}

function handleCanvasClick(event) {
  const clickedCell = pickCellFromEvent(event);
  if (!clickedCell) {
    return;
  }

  selectedCell = clickedCell;
  moveHighlight(selectedHighlight, selectedCell);
  updateCellPanel(selectedCell);
}

function pickCellFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, false);
  return hits.length ? extractCell(hits[0].object) : null;
}

function extractCell(object) {
  const { row, col, type } = object.userData;
  if (row === undefined || col === undefined) {
    return null;
  }

  return {
    row,
    col,
    type,
    temperature: temperatures[row][col],
  };
}

function updateCellPanel(cell) {
  const cover = LAND_COVER[cell.type];
  const temp = temperatures[cell.row][cell.col];
  readouts.cellCover.textContent = cover.label;
  readouts.cellTemp.textContent = `LST: ${formatTemp(temp)}`;
}

function showTooltip(event, cell) {
  const cover = LAND_COVER[cell.type];
  tooltipEl.style.display = "block";
  tooltipEl.style.left = `${event.clientX}px`;
  tooltipEl.style.top = `${event.clientY}px`;
  tooltipEl.innerHTML = `<strong>${cover.label}</strong>LST: ${formatTemp(cell.temperature)}`;
}

function clearHover() {
  hoveredCell = null;
  hoverHighlight.visible = false;
  tooltipEl.style.display = "none";

  if (selectedCell) {
    updateCellPanel(selectedCell);
  }
}

function createHighlight(color) {
  const highlight = new THREE.Mesh(
    new THREE.BoxGeometry(CELL_SIZE * 1.02, 0.035, CELL_SIZE * 1.02),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    })
  );
  highlight.visible = false;
  return highlight;
}

function moveHighlight(highlight, cell) {
  const tile = tileMeshes[cell.row][cell.col];
  highlight.position.set(tile.position.x, tile.geometry.parameters.height + 0.055, tile.position.z);
  highlight.visible = true;
}

function formatTemp(value) {
  return `${value.toFixed(1)} C`;
}

function handleResize() {
  const width = sceneEl.clientWidth;
  const height = sceneEl.clientHeight;

  camera.aspect = width / height;
  renderer.setSize(width, height);
  configureCameraForViewport();
}

function configureCameraForViewport() {
  const aspect = sceneEl.clientWidth / sceneEl.clientHeight;

  if (aspect < 0.85) {
    camera.fov = 52;
    camera.position.set(9.2, 10.2, 16.2);
    controls.target.set(0, 0.15, 0);
    controls.minDistance = 10;
    controls.maxDistance = 28;
  } else {
    camera.fov = 45;
    camera.position.set(7.8, 8.3, 10.5);
    controls.target.set(0, 0.2, 0);
    controls.minDistance = 7;
    controls.maxDistance = 22;
  }

  camera.updateProjectionMatrix();
  controls.update();
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
