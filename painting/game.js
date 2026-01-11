// Game State
let gameState = {
    apiToken: null,
    generatedImage: null,
    currentTool: 'brush',
    currentColor: '#000000',
    brushSize: 5,
    isDrawing: false,
    lastX: 0,
    lastY: 0
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
    eraserTool: document.getElementById('eraserTool'),

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

    elements.eraserTool.addEventListener('click', () => {
        setTool('eraser');
    });

    // Event Listeners - Actions
    elements.clearBtn.addEventListener('click', clearCanvas);
    elements.showOriginalBtn.addEventListener('click', showOriginal);
    elements.downloadBtn.addEventListener('click', downloadImage);
    elements.newGameBtn.addEventListener('click', newGame);

    // Modal close
    elements.originalModal.querySelector('.close').addEventListener('click', closeOriginal);
    elements.originalModal.addEventListener('click', (e) => {
        if (e.target === elements.originalModal) closeOriginal();
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
    const tracePrompt = `Create a simple black and white line drawing, coloring book style image of: ${prompt}. The image should have clear, bold black outlines with white background, suitable for tracing and coloring. Simple, clean lines like a coloring book page.`;

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

function startDrawing(e) {
    gameState.isDrawing = true;
    const coords = getCanvasCoordinates(e);
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

    // Switch to brush if using eraser
    if (gameState.currentTool === 'eraser') {
        setTool('brush');
    }
}

function setTool(tool) {
    gameState.currentTool = tool;

    if (tool === 'brush') {
        elements.brushTool.classList.add('active');
        elements.eraserTool.classList.remove('active');
        elements.paintingCanvas.style.cursor = 'crosshair';
    } else if (tool === 'eraser') {
        elements.eraserTool.classList.add('active');
        elements.brushTool.classList.remove('active');
        elements.paintingCanvas.style.cursor = 'cell';
    }
}

// Action Functions
function clearCanvas() {
    if (!confirm('Are you sure you want to clear all your painting?')) return;

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
