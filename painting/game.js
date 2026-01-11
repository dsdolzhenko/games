// Game State
let gameState = {
    apiToken: null,
    generatedImage: null,
    currentTool: 'brush',
    currentColor: '#000000',
    brushSize: 5,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    history: [],
    maxHistorySize: 20
};

// DOM Elements
const elements = {
    tokenModal: document.getElementById('tokenModal'),
    apiTokenInput: document.getElementById('apiTokenInput'),
    saveTokenBtn: document.getElementById('saveTokenBtn'),
    changeTokenBtn: document.getElementById('changeTokenBtn'),

    promptSection: document.getElementById('promptSection'),
    promptInput: document.getElementById('promptInput'),
    generateBtn: document.getElementById('generateBtn'),

    loadingIndicator: document.getElementById('loadingIndicator'),

    paintingSection: document.getElementById('paintingSection'),
    paintingCanvas: document.getElementById('paintingCanvas'),

    colorPicker: document.getElementById('colorPicker'),
    colorPresets: document.querySelectorAll('.color-preset'),
    brushSize: document.getElementById('brushSize'),
    brushSizeLabel: document.getElementById('brushSizeLabel'),
    brushTool: document.getElementById('brushTool'),
    fillTool: document.getElementById('fillTool'),
    eraserTool: document.getElementById('eraserTool'),

    undoBtn: document.getElementById('undoBtn'),
    clearBtn: document.getElementById('clearBtn'),
    showOriginalBtn: document.getElementById('showOriginalBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    newGameBtn: document.getElementById('newGameBtn'),

    originalModal: document.getElementById('originalModal'),
    originalImage: document.getElementById('originalImage')
};

// Canvas context
let ctx;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Check for saved token
    const savedToken = localStorage.getItem('openai_token');
    if (savedToken) {
        gameState.apiToken = savedToken;
        elements.changeTokenBtn.style.display = 'block';
        elements.newGameBtn.style.display = 'block';
    } else {
        elements.tokenModal.style.display = 'flex';
    }

    // Setup canvas
    ctx = elements.paintingCanvas.getContext('2d');

    // Event Listeners - Token
    elements.saveTokenBtn.addEventListener('click', saveToken);
    elements.changeTokenBtn.addEventListener('click', changeToken);

    // Event Listeners - Generation
    elements.generateBtn.addEventListener('click', generateImage);
    elements.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateImage();
        }
    });

    // Event Listeners - Drawing
    elements.paintingCanvas.addEventListener('mousedown', startDrawing);
    elements.paintingCanvas.addEventListener('mousemove', draw);
    elements.paintingCanvas.addEventListener('mouseup', stopDrawing);
    elements.paintingCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile
    elements.paintingCanvas.addEventListener('touchstart', handleTouchStart);
    elements.paintingCanvas.addEventListener('touchmove', handleTouchMove);
    elements.paintingCanvas.addEventListener('touchend', stopDrawing);

    // Event Listeners - Tools
    elements.colorPicker.addEventListener('input', (e) => {
        setColor(e.target.value);
    });

    elements.colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            setColor(preset.dataset.color);
        });
    });

    elements.brushSize.addEventListener('input', (e) => {
        gameState.brushSize = parseInt(e.target.value);
        elements.brushSizeLabel.textContent = e.target.value;
    });

    elements.brushTool.addEventListener('click', () => {
        setTool('brush');
    });

    elements.fillTool.addEventListener('click', () => {
        setTool('fill');
    });

    elements.eraserTool.addEventListener('click', () => {
        setTool('eraser');
    });

    // Event Listeners - Actions
    elements.undoBtn.addEventListener('click', undo);
    elements.clearBtn.addEventListener('click', clearCanvas);
    elements.showOriginalBtn.addEventListener('click', showOriginal);
    elements.downloadBtn.addEventListener('click', downloadImage);
    elements.newGameBtn.addEventListener('click', newGame);

    // Modal close
    elements.originalModal.querySelector('.close').addEventListener('click', closeOriginal);
    elements.originalModal.addEventListener('click', (e) => {
        if (e.target === elements.originalModal) closeOriginal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
    });
}

// Token Management
function saveToken() {
    const token = elements.apiTokenInput.value.trim();
    if (!token) {
        alert('Please enter a valid API token');
        return;
    }
    if (!token.startsWith('sk-')) {
        alert('OpenAI API tokens typically start with "sk-". Please verify your token.');
        return;
    }
    localStorage.setItem('openai_token', token);
    gameState.apiToken = token;
    elements.tokenModal.style.display = 'none';
    elements.changeTokenBtn.style.display = 'block';
    elements.newGameBtn.style.display = 'block';
    alert('Token saved successfully!');
}

function changeToken() {
    elements.apiTokenInput.value = '';
    elements.tokenModal.style.display = 'flex';
}

// Image Generation
async function generateImage() {
    const prompt = elements.promptInput.value.trim();

    if (!prompt) {
        alert('Please enter a description of what you want to paint');
        return;
    }

    if (!gameState.apiToken) {
        alert('Please set your OpenAI API token first');
        elements.tokenModal.style.display = 'flex';
        return;
    }

    // Show loading
    elements.promptSection.style.display = 'none';
    elements.loadingIndicator.style.display = 'block';

    try {
        // Generate trace-the-lines style image with DALL-E
        const imageData = await generateTraceImage(prompt);

        // Store and display the image
        gameState.generatedImage = imageData;

        // Load image onto canvas
        const img = new Image();
        img.onload = () => {
            // Set canvas size to match image (up to max size)
            const maxSize = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = width * ratio;
                height = height * ratio;
            }

            elements.paintingCanvas.width = width;
            elements.paintingCanvas.height = height;

            // Draw the generated image as background
            ctx.drawImage(img, 0, 0, width, height);

            // Clear history and save initial state
            clearHistory();

            // Show painting section
            elements.loadingIndicator.style.display = 'none';
            elements.paintingSection.style.display = 'block';
            elements.paintingSection.scrollIntoView({ behavior: 'smooth' });
        };

        img.onerror = () => {
            throw new Error('Failed to load generated image');
        };

        img.src = imageData;

    } catch (error) {
        console.error('Generation error:', error);
        elements.loadingIndicator.style.display = 'none';
        elements.promptSection.style.display = 'block';

        let errorMessage = 'Failed to generate image: ' + error.message;

        if (error.message.includes('401') || error.message.includes('authentication')) {
            errorMessage += '\n\nYour API token may be invalid. Please check it and try again.';
            elements.tokenModal.style.display = 'flex';
        } else if (error.message.includes('quota') || error.message.includes('429')) {
            errorMessage += '\n\nYou may have exceeded your API quota. Please check your OpenAI account.';
        }

        alert(errorMessage);
    }
}

async function generateTraceImage(prompt) {
    // Create a prompt for a trace-the-lines / coloring book style image
    const tracePrompt = `Create a simple black and white line drawing, coloring book style image of: ONE ${prompt}. The subject should be centered in the image. The image should have clear, bold black outlines with white background, suitable for tracing and coloring. Simple, clean lines like a coloring book page. Important: show only a single subject, centered in the frame.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gameState.apiToken}`
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: tracePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'b64_json'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`DALL-E API error (${response.status}): ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return `data:image/png;base64,${data.data[0].b64_json}`;
}

// Drawing Functions
function getCanvasCoordinates(e) {
    const rect = elements.paintingCanvas.getBoundingClientRect();
    const scaleX = elements.paintingCanvas.width / rect.width;
    const scaleY = elements.paintingCanvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// History Management
function saveState() {
    // Save current canvas state as ImageData
    const imageData = ctx.getImageData(0, 0, elements.paintingCanvas.width, elements.paintingCanvas.height);

    // Add to history
    gameState.history.push(imageData);

    // Limit history size
    if (gameState.history.length > gameState.maxHistorySize) {
        gameState.history.shift(); // Remove oldest state
    }

    // Update undo button state
    updateUndoButton();
}

function undo() {
    if (gameState.history.length === 0) return;

    // Get the previous state
    const previousState = gameState.history.pop();

    // Restore it to the canvas
    ctx.putImageData(previousState, 0, 0);

    // Update undo button state
    updateUndoButton();
}

function updateUndoButton() {
    // Enable/disable undo button based on history
    elements.undoBtn.disabled = gameState.history.length === 0;
}

function clearHistory() {
    gameState.history = [];
    updateUndoButton();
}

// Flood Fill Algorithm
function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, elements.paintingCanvas.width, elements.paintingCanvas.height);
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Convert hex color to RGB
    const fillRGB = hexToRgb(fillColor);
    if (!fillRGB) return;

    // Get the color at the starting pixel
    const startPos = (startY * width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Prevent filling black lines (protect the original outline)
    // Check if the starting pixel is very dark (close to black)
    const blackThreshold = 40; // RGB values below this are considered black lines
    if (startR < blackThreshold && startG < blackThreshold && startB < blackThreshold) {
        return; // Ignore clicks on black lines
    }

    // If the color is already the fill color, nothing to do
    if (startR === fillRGB.r && startG === fillRGB.g && startB === fillRGB.b) {
        return;
    }

    // Stack-based flood fill
    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
        const [x, y] = stack.pop();

        // Skip if out of bounds
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        // Create unique key for this pixel
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        // Get pixel position
        const pos = (y * width + x) * 4;

        // Check if pixel matches the start color
        const r = pixels[pos];
        const g = pixels[pos + 1];
        const b = pixels[pos + 2];
        const a = pixels[pos + 3];

        // Allow small color difference for better filling (tolerance)
        const tolerance = 10;
        if (
            Math.abs(r - startR) <= tolerance &&
            Math.abs(g - startG) <= tolerance &&
            Math.abs(b - startB) <= tolerance &&
            Math.abs(a - startA) <= tolerance
        ) {
            // Fill this pixel
            pixels[pos] = fillRGB.r;
            pixels[pos + 1] = fillRGB.g;
            pixels[pos + 2] = fillRGB.b;
            pixels[pos + 3] = 255; // Full opacity

            // Add neighboring pixels to stack
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }

    // Put the modified image data back to the canvas
    ctx.putImageData(imageData, 0, 0);
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function startDrawing(e) {
    const coords = getCanvasCoordinates(e);

    // Save state before any drawing operation
    saveState();

    // Handle fill tool separately
    if (gameState.currentTool === 'fill') {
        floodFill(Math.floor(coords.x), Math.floor(coords.y), gameState.currentColor);
        return;
    }

    // For brush and eraser, start drawing
    gameState.isDrawing = true;
    gameState.lastX = coords.x;
    gameState.lastY = coords.y;
}

function draw(e) {
    if (!gameState.isDrawing) return;

    const coords = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(gameState.lastX, gameState.lastY);
    ctx.lineTo(coords.x, coords.y);

    if (gameState.currentTool === 'brush') {
        ctx.strokeStyle = gameState.currentColor;
        ctx.globalCompositeOperation = 'source-over';
    } else if (gameState.currentTool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineWidth = gameState.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    gameState.lastX = coords.x;
    gameState.lastY = coords.y;
}

function stopDrawing() {
    gameState.isDrawing = false;
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    elements.paintingCanvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    elements.paintingCanvas.dispatchEvent(mouseEvent);
}

// Tool Functions
function setColor(color) {
    gameState.currentColor = color;
    elements.colorPicker.value = color;

    // Update active state on presets
    elements.colorPresets.forEach(preset => {
        if (preset.dataset.color.toLowerCase() === color.toLowerCase()) {
            preset.classList.add('active');
        } else {
            preset.classList.remove('active');
        }
    });

    // Switch to brush if using eraser (can't erase with color)
    if (gameState.currentTool === 'eraser') {
        setTool('brush');
    }
    // Note: fill tool keeps working with the new color
}

function setTool(tool) {
    gameState.currentTool = tool;

    // Remove active class from all tools
    elements.brushTool.classList.remove('active');
    elements.fillTool.classList.remove('active');
    elements.eraserTool.classList.remove('active');

    if (tool === 'brush') {
        elements.brushTool.classList.add('active');
        elements.paintingCanvas.style.cursor = 'crosshair';
    } else if (tool === 'fill') {
        elements.fillTool.classList.add('active');
        elements.paintingCanvas.style.cursor = 'pointer';
    } else if (tool === 'eraser') {
        elements.eraserTool.classList.add('active');
        elements.paintingCanvas.style.cursor = 'cell';
    }
}

// Action Functions
function clearCanvas() {
    if (!confirm('Are you sure you want to clear all your painting?')) return;

    // Save state before clearing
    saveState();

    // Reload the original generated image
    if (gameState.generatedImage) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, elements.paintingCanvas.width, elements.paintingCanvas.height);
            ctx.drawImage(img, 0, 0, elements.paintingCanvas.width, elements.paintingCanvas.height);
        };
        img.src = gameState.generatedImage;
    }
}

function showOriginal() {
    if (gameState.generatedImage) {
        elements.originalImage.src = gameState.generatedImage;
        elements.originalModal.style.display = 'flex';
    }
}

function closeOriginal() {
    elements.originalModal.style.display = 'none';
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = 'my-painting.png';
    link.href = elements.paintingCanvas.toDataURL();
    link.click();
}

function newGame() {
    if (gameState.generatedImage) {
        if (!confirm('Are you sure you want to start a new game? Your current painting will be lost.')) {
            return;
        }
    }

    // Reset state
    gameState.generatedImage = null;
    elements.promptInput.value = '';

    // Clear history
    clearHistory();

    // Clear canvas
    if (ctx) {
        ctx.clearRect(0, 0, elements.paintingCanvas.width, elements.paintingCanvas.height);
    }

    // Show prompt section
    elements.paintingSection.style.display = 'none';
    elements.loadingIndicator.style.display = 'none';
    elements.promptSection.style.display = 'block';
    elements.promptSection.scrollIntoView({ behavior: 'smooth' });
}
