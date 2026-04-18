const form = document.getElementById("grid-form");
const resetButton = document.getElementById("reset-btn");
const xInput = document.getElementById("x-input");
const yInput = document.getElementById("y-input");
const zInput = document.getElementById("z-input");
const gridPreview = document.getElementById("grid-preview");
const gridSummary = document.getElementById("grid-summary");

const statX = document.getElementById("stat-x");
const statY = document.getElementById("stat-y");
const statZ = document.getElementById("stat-z");
const statTotal = document.getElementById("stat-total");

const defaults = {
  x: 8,
  y: 6,
  z: 4,
};

function sanitizeAxis(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function updateStats(x, y, z) {
  statX.textContent = x;
  statY.textContent = y;
  statZ.textContent = z;
  statTotal.textContent = x * y;
  gridSummary.textContent = `${x} × ${y} × ${z}`;
}

function createCell(column, row, zLevel, zMax) {
  const cell = document.createElement("div");
  cell.className = "grid-cell";

  const fill = document.createElement("div");
  fill.className = "grid-fill";
  fill.style.height = `${(zLevel / zMax) * 100}%`;

  const meta = document.createElement("div");
  meta.className = "grid-meta";

  const coords = document.createElement("span");
  coords.className = "grid-coords";
  coords.textContent = `r${row} • c${column}`;

  const depth = document.createElement("span");
  depth.className = "grid-depth";
  depth.textContent = `z${zLevel}`;

  meta.append(coords, depth);
  cell.append(fill, meta);

  return cell;
}

function renderGrid(x, y, z) {
  gridPreview.innerHTML = "";
  gridPreview.style.gridTemplateColumns = `repeat(${x}, minmax(0, 1fr))`;

  const fragment = document.createDocumentFragment();
  const cellLimit = 900;
  const totalCells = x * y;
  const visibleCells = Math.min(totalCells, cellLimit);

  for (let index = 0; index < visibleCells; index += 1) {
    const row = Math.floor(index / x) + 1;
    const column = (index % x) + 1;
    const zLevel = ((row + column - 2) % z) + 1;
    const cell = createCell(column, row, zLevel, z);
    fragment.appendChild(cell);
  }

  gridPreview.appendChild(fragment);
  updateStats(x, y, z);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const x = sanitizeAxis(xInput.value);
  const y = sanitizeAxis(yInput.value);
  const z = sanitizeAxis(zInput.value);

  xInput.value = x;
  yInput.value = y;
  zInput.value = z;

  renderGrid(x, y, z);
});

resetButton.addEventListener("click", () => {
  xInput.value = defaults.x;
  yInput.value = defaults.y;
  zInput.value = defaults.z;
  renderGrid(defaults.x, defaults.y, defaults.z);
});

renderGrid(defaults.x, defaults.y, defaults.z);
