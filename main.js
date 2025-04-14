const canvas = document.getElementById('drawingCanvas');
const bgCanvas = document.getElementById('backgroundCanvas');
const nav = document.querySelector(".navbar");
const ctx = canvas.getContext('2d');
const bgCtx = bgCanvas.getContext('2d');

// Canvas setup
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
canvas.width = bgCanvas.width = CANVAS_WIDTH;
canvas.height = bgCanvas.height = CANVAS_HEIGHT;

// Performance improvement
canvas.willReadFrequently = true;
bgCanvas.willReadFrequently = true;

// Initial state
let isDrawing = false;
let currentTool = 'pencil';
let currentColor = '#000000';
let currentSize = 5;
let bgColor = '#ffffff';
let currentShape = null;
let startX, startY;
let drawingHistory = [];
let historyIndex = -1;

// Initialize
bgCtx.fillStyle = bgColor;
bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = currentSize;
ctx.strokeStyle = currentColor;

// Event Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

document.querySelectorAll('.tool-btn').forEach(btn => {
    const tool = btn.classList[1];
    if (tool === 'shapes') return;
    btn.addEventListener('click', () => setTool(tool));
});

document.querySelector('.shapes').addEventListener('click', toggleShapeMenu);
document.querySelectorAll('.shape-option').forEach(btn => {
    btn.addEventListener('click', selectShape);
});

document.querySelector('.size-control').addEventListener('input', e => {
    currentSize = e.target.value;
    ctx.lineWidth = currentSize;
});

document.querySelector('.color-picker').addEventListener('input', e => {
    currentColor = e.target.value;
    ctx.strokeStyle = currentColor;
});

document.querySelector('.bg-color-picker').addEventListener('input', e => {
    bgColor = e.target.value;
    bgCtx.fillStyle = bgColor;
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
});

document.querySelector('.undo').addEventListener('click', undo);
document.querySelector('.redo').addEventListener('click', redo);
document.querySelector('.reset').addEventListener('click', resetCanvas);
document.querySelector('.save').addEventListener('click', saveCanvas);

// Functions
function setTool(tool) {
    currentTool = tool;
    currentShape = null;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));

    if (tool !== "shape") {
        document.querySelector(`.${tool}`).classList.add('active');
    }

    if (tool === 'eraser') {
        ctx.strokeStyle = bgColor;
    } else {
        ctx.strokeStyle = currentColor;
    }
}

function startDrawing(e) {
    isDrawing = true;
    [startX, startY] = getMousePos(e);

    ctx.beginPath();
    if (!currentShape) {
        ctx.moveTo(startX, startY);
    }
    
    if (drawingHistory.length === 0 || historyIndex === -1) {
        saveState();
    }
}

function draw(e) {
    if (!isDrawing) return;
    const [x, y] = getMousePos(e);

    if (currentShape) {
        // Clear and restore previous state for shape preview
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (historyIndex >= 0) {
            ctx.putImageData(drawingHistory[historyIndex], 0, 0);
        }
        drawShape(startX, startY, x, y);
        return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
}

function endDrawing() {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentShape) {
        saveState();
        currentShape = null;
    }
}

function drawShape(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;

    switch (currentShape) {
        case 'rect':
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            break;
        case 'circle':
            const radius = Math.hypot(x2 - x1, y2 - y1);
            ctx.arc(x1, y1, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 'line':
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            break;
    }
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return [
        e.clientX - rect.left,
        e.clientY - rect.top
    ];
}

function saveState() {
    historyIndex++;
    drawingHistory.length = historyIndex;
    drawingHistory.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
}

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    ctx.putImageData(drawingHistory[historyIndex], 0, 0);
}

function redo() {
    if (historyIndex >= drawingHistory.length - 1) return;
    historyIndex++;
    ctx.putImageData(drawingHistory[historyIndex], 0, 0);
}

function resetCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgCtx.fillStyle = bgColor;
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawingHistory = [];
    historyIndex = -1;
    saveState();
}

function toggleShapeMenu() {
    const modal = document.querySelector('.shapes-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function selectShape(e) {
    // Get the closest button element to handle clicks on the icon
    const button = e.target.closest('.shape-option');
    if (!button) return;
    
    currentShape = button.getAttribute('data-shape');
    document.querySelector('.shapes-modal').style.display = 'none';
    
    // Update the UI to show active state
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.shapes').classList.add('active');
}

function saveCanvas() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(bgCanvas, 0, 0);
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = tempCanvas.toDataURL();
    link.click();
}

// Initialize
saveState();
