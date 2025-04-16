
document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const drawingCanvas = document.getElementById('drawingCanvas');
    const backgroundCanvas = document.getElementById('backgroundCanvas');
    const ctx = drawingCanvas.getContext('2d');
    const bgCtx = backgroundCanvas.getContext('2d');
    
    // Tool elements
    const pencilBtn = document.querySelector('.pencil');
    const eraserBtn = document.querySelector('.eraser');
    const resetBtn = document.querySelector('.reset');
    const undoBtn = document.querySelector('.undo');
    const redoBtn = document.querySelector('.redo');
    const shapesBtn = document.querySelector('.shapes');
    const saveBtn = document.querySelector('.save');
    const sizeControl = document.querySelector('.size-control');
    const colorPicker = document.querySelector('.color-picker');
    const bgColorPicker = document.querySelector('.bg-color-picker');
    const shapesModal = document.querySelector('.shapes-modal');
    const shapeOptions = document.querySelectorAll('.shape-option');
    
    // App state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'pencil';
    let currentShape = null;
    let lineWidth = sizeControl.value;
    let strokeColor = colorPicker.value;
    let bgColor = bgColorPicker.value;
    let history = [];
    let redoStack = [];
    let startX, startY;
    let shapeInProgress = false;
    
    // Local storage keys
    const STORAGE_DRAWING_KEY = 'artbuddy-drawing';
    const STORAGE_BG_COLOR_KEY = 'artbuddy-bg-color';
    
    // Initialize canvas size
    function resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        drawingCanvas.width = container.offsetWidth;
        drawingCanvas.height = container.offsetHeight;
        backgroundCanvas.width = container.offsetWidth;
        backgroundCanvas.height = container.offsetHeight;
        
        // Load saved background color or use default
        loadBackgroundColor();
        
        // Redraw content if there's any history
        if (history.length > 0) {
            restoreCanvasState(history[history.length - 1]);
        } else {
            loadFromLocalStorage();
        }
    }
    
    // Save current canvas state to history
    function saveCanvasState() {
        const imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        history.push(imageData);
        redoStack = []; // Clear redo stack on new action
        
        // Save to local storage
        saveToLocalStorage();
    }
    
    // Restore canvas from saved state
    function restoreCanvasState(imageData) {
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Clear canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
    
    // Save drawing to local storage
    function saveToLocalStorage() {
        try {
            // Save the drawing
            localStorage.setItem(STORAGE_DRAWING_KEY, drawingCanvas.toDataURL());
            
            // Save background color
            localStorage.setItem(STORAGE_BG_COLOR_KEY, bgColor);
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }
    
    // Load drawing from local storage
    function loadFromLocalStorage() {
        try {
            // Load drawing
            const savedDrawing = localStorage.getItem(STORAGE_DRAWING_KEY);
            if (savedDrawing) {
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                    // Create initial history entry
                    const imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
                    history = [imageData];
                };
                img.src = savedDrawing;
            }
            
            // Load background is handled by loadBackgroundColor()
        } catch (error) {
            console.error('Error loading from local storage:', error);
        }
    }
    
    // Load background color from local storage
    function loadBackgroundColor() {
        try {
            const savedBgColor = localStorage.getItem(STORAGE_BG_COLOR_KEY);
            if (savedBgColor) {
                bgColor = savedBgColor;
                bgColorPicker.value = bgColor;
            }
            
            // Apply background color to canvas
            bgCtx.fillStyle = bgColor;
            bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        } catch (error) {
            console.error('Error loading background color from local storage:', error);
        }
    }
    
    // Draw functions
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getPointerPosition(e);
        
        if (currentShape) {
            shapeInProgress = true;
            startX = lastX;
            startY = lastY;
            saveCanvasState(); // Save state before drawing shape
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const [currentX, currentY] = getPointerPosition(e);
        
        if (currentShape && shapeInProgress) {
            // For shapes, preview by clearing and redrawing
            clearCanvas();
            restoreCanvasState(history[history.length - 1]);
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = currentTool === 'eraser' ? bgColor : strokeColor;
            
            drawShape(startX, startY, currentX, currentY);
            
            ctx.stroke();
            return;
        }
        
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentTool === 'eraser' ? bgColor : strokeColor;
        
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        [lastX, lastY] = [currentX, currentY];
    }
    
    function endDrawing() {
        if (isDrawing) {
            isDrawing = false;
            
            if (currentShape && shapeInProgress) {
                shapeInProgress = false;
                saveCanvasState(); // Save the completed shape
            } else if (!currentShape) {
                saveCanvasState(); // Save the completed free drawing
            }
        }
    }
    
    // Shape drawing helper
    function drawShape(startX, startY, endX, endY) {
        switch (currentShape) {
            case 'rect':
                ctx.rect(startX, startY, endX - startX, endY - startY);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                break;
            case 'line':
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                break;
        }
    }
    
    // Get mouse or touch position
    function getPointerPosition(e) {
        if (e.type.includes('touch')) {
            const rect = drawingCanvas.getBoundingClientRect();
            return [
                e.touches[0].clientX - rect.left,
                e.touches[0].clientY - rect.top
            ];
        } else {
            return [e.offsetX, e.offsetY];
        }
    }
    
    // Tool handlers
    pencilBtn.addEventListener('click', () => {
        setActiveTool('pencil');
        currentShape = null;
    });
    
    eraserBtn.addEventListener('click', () => {
        setActiveTool('eraser');
        currentShape = null;
    });
    
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas?')) {
            clearCanvas();
            saveCanvasState();
        }
    });
    
    undoBtn.addEventListener('click', () => {
        if (history.length > 1) {
            redoStack.push(history.pop()); // Move current state to redo stack
            clearCanvas();
            restoreCanvasState(history[history.length - 1]);
            saveToLocalStorage(); // Update local storage after undo
        } else if (history.length === 1) {
            redoStack.push(history.pop());
            clearCanvas();
            saveToLocalStorage(); // Update local storage after clearing
        }
    });
    
    redoBtn.addEventListener('click', () => {
        if (redoStack.length > 0) {
            const state = redoStack.pop();
            history.push(state);
            clearCanvas();
            restoreCanvasState(state);
            saveToLocalStorage(); // Update local storage after redo
        }
    });
    
    shapesBtn.addEventListener('click', () => {
        shapesModal.classList.toggle('active');
    });
    
    shapeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const shape = option.getAttribute('data-shape');
            currentShape = shape;
            setActiveTool('pencil'); // Reset to pencil as base tool for shapes
            shapesModal.classList.remove('active');
        });
    });
    
    saveBtn.addEventListener('click', () => {
        // Create a temporary canvas that combines background and drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawingCanvas.width;
        tempCanvas.height = drawingCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw background
        tempCtx.fillStyle = bgColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw content
        tempCtx.drawImage(drawingCanvas, 0, 0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'artbuddy-drawing.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    });
    
    // Settings handlers
    sizeControl.addEventListener('input', () => {
        lineWidth = sizeControl.value;
    });
    
    colorPicker.addEventListener('input', () => {
        strokeColor = colorPicker.value;
    });
    
    bgColorPicker.addEventListener('input', () => {
        bgColor = bgColorPicker.value;
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        
        // Save background color to local storage
        localStorage.setItem(STORAGE_BG_COLOR_KEY, bgColor);
    });
    
    // Set active tool helper
    function setActiveTool(tool) {
        // Reset active states
        pencilBtn.classList.remove('active');
        eraserBtn.classList.remove('active');
        
        // Set new active state
        if (tool === 'pencil') {
            pencilBtn.classList.add('active');
        } else if (tool === 'eraser') {
            eraserBtn.classList.add('active');
        }
        
        currentTool = tool;
    }
    
    // Event listeners for drawing
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', endDrawing);
    drawingCanvas.addEventListener('mouseout', endDrawing);
    
    // Touch support
    drawingCanvas.addEventListener('touchstart', startDrawing);
    drawingCanvas.addEventListener('touchmove', draw);
    drawingCanvas.addEventListener('touchend', endDrawing);
    
    // Prevent scrolling when touching the canvas
    drawingCanvas.addEventListener('touchstart', e => e.preventDefault());
    drawingCanvas.addEventListener('touchmove', e => e.preventDefault());
    
    // Click outside shapes modal to close it
    document.addEventListener('click', (e) => {
        if (!shapesModal.contains(e.target) && e.target !== shapesBtn) {
            shapesModal.classList.remove('active');
        }
    });
    
    // Initialize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create initial history entry if loading from scratch
    if (history.length === 0 && !localStorage.getItem(STORAGE_DRAWING_KEY)) {
        saveCanvasState(); // Initial empty state
    }
});