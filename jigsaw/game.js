// Game State
let gameState = {
    apiToken: null,
    originalImage: null,
    cartoonImage: null,
    difficulty: 3,
    pieces: [],
    grid: [],
    currentStream: null
};

// DOM Elements
const elements = {
    tokenModal: document.getElementById('tokenModal'),
    tokenInput: document.getElementById('tokenInput'),
    saveTokenBtn: document.getElementById('saveToken'),
    changeTokenBtn: document.getElementById('changeTokenBtn'),
    gameContainer: document.getElementById('gameContainer'),

    uploadSection: document.getElementById('uploadSection'),
    uploadBtn: document.getElementById('uploadBtn'),
    cameraBtn: document.getElementById('cameraBtn'),
    fileInput: document.getElementById('fileInput'),
    camera: document.getElementById('camera'),
    captureBtn: document.getElementById('captureBtn'),
    captureCanvas: document.getElementById('captureCanvas'),

    previewSection: document.getElementById('previewSection'),
    originalImage: document.getElementById('originalImage'),
    transformBtn: document.getElementById('transformBtn'),
    loadingIndicator: document.getElementById('loadingIndicator'),

    cartoonSection: document.getElementById('cartoonSection'),
    cartoonImage: document.getElementById('cartoonImage'),
    startGameBtn: document.getElementById('startGameBtn'),

    puzzleSection: document.getElementById('puzzleSection'),
    puzzleGrid: document.getElementById('puzzleGrid'),
    piecesPool: document.getElementById('piecesPool'),
    showPreviewBtn: document.getElementById('showPreviewBtn'),
    previewModal: document.getElementById('previewModal'),
    previewImage: document.getElementById('previewImage'),
    resetBtn: document.getElementById('resetBtn'),
    newGameBtn: document.getElementById('newGameBtn'),

    victoryMessage: document.getElementById('victoryMessage'),
    playAgainBtn: document.getElementById('playAgainBtn'),

    difficultySelect: document.getElementById('difficulty')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Check for saved API token
    const savedToken = localStorage.getItem('openai_token');
    if (savedToken) {
        gameState.apiToken = savedToken;
        elements.tokenModal.style.display = 'none';
        elements.gameContainer.style.display = 'block';
    }

    // Event Listeners
    elements.saveTokenBtn.addEventListener('click', saveToken);
    elements.changeTokenBtn.addEventListener('click', changeToken);
    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.cameraBtn.addEventListener('click', startCamera);
    elements.captureBtn.addEventListener('click', capturePhoto);
    elements.transformBtn.addEventListener('click', transformImage);
    elements.startGameBtn.addEventListener('click', startPuzzleGame);
    elements.showPreviewBtn.addEventListener('click', showPreview);
    elements.resetBtn.addEventListener('click', resetPuzzle);
    elements.newGameBtn.addEventListener('click', newGame);
    elements.playAgainBtn.addEventListener('click', newGame);
    elements.difficultySelect.addEventListener('change', updateDifficulty);

    // Preview modal close
    elements.previewModal.querySelector('.close').addEventListener('click', closePreview);
    elements.previewModal.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) closePreview();
    });
}

// Token Management
function saveToken() {
    const token = elements.tokenInput.value.trim();
    if (!token) {
        alert('Please enter a valid API token');
        return;
    }

    gameState.apiToken = token;
    localStorage.setItem('openai_token', token);
    elements.tokenModal.style.display = 'none';
    elements.gameContainer.style.display = 'block';
}

function changeToken() {
    elements.tokenInput.value = gameState.apiToken;
    elements.tokenModal.style.display = 'flex';
}

// Image Upload/Capture
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        gameState.originalImage = e.target.result;
        showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

async function startCamera() {
    try {
        gameState.currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        elements.camera.srcObject = gameState.currentStream;
        elements.camera.style.display = 'block';
        elements.captureBtn.style.display = 'block';
        elements.cameraBtn.style.display = 'none';
        elements.uploadBtn.style.display = 'none';
    } catch (error) {
        alert('Unable to access camera: ' + error.message);
    }
}

function capturePhoto() {
    const canvas = elements.captureCanvas;
    const video = elements.camera;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    gameState.originalImage = canvas.toDataURL('image/jpeg');

    // Stop camera
    if (gameState.currentStream) {
        gameState.currentStream.getTracks().forEach(track => track.stop());
    }

    elements.camera.style.display = 'none';
    elements.captureBtn.style.display = 'none';
    elements.cameraBtn.style.display = 'block';
    elements.uploadBtn.style.display = 'block';

    showImagePreview(gameState.originalImage);
}

function showImagePreview(imageData) {
    elements.originalImage.src = imageData;
    elements.previewSection.style.display = 'block';
    elements.uploadSection.scrollIntoView({ behavior: 'smooth' });
}

// OpenAI Image Transformation
async function transformImage() {
    if (!gameState.originalImage) return;

    elements.transformBtn.disabled = true;
    elements.loadingIndicator.style.display = 'block';

    try {
        // Convert data URL to blob
        const response = await fetch(gameState.originalImage);
        const blob = await response.blob();

        // Convert blob to base64 without data URL prefix
        const base64 = await blobToBase64(blob);
        const base64Data = base64.split(',')[1];

        // Call OpenAI API
        const result = await callOpenAIImageEdit(base64Data);

        gameState.cartoonImage = result;
        elements.cartoonImage.src = result;
        elements.cartoonSection.style.display = 'block';
        elements.cartoonSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        alert('Failed to transform image: ' + error.message);
        console.error(error);
    } finally {
        elements.transformBtn.disabled = false;
        elements.loadingIndicator.style.display = 'none';
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function callOpenAIImageEdit(base64Image) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'Convert this image into a cartoon/animated style. Make it look like a hand-drawn cartoon with bold outlines and vibrant colors. Keep the same composition and content, just transform the style to look like an animated cartoon.'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            },
            {
                role: 'user',
                content: 'Please generate an image based on my request.'
            }
        ],
        max_tokens: 500
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();

        // Since GPT-4o with vision doesn't generate images directly,
        // we need to use DALL-E 3 for image generation
        const cartoonPrompt = "A cartoon/animated style version of: " +
            (data.choices[0]?.message?.content || "the uploaded image");

        return await generateCartoonWithDallE(cartoonPrompt, base64Image);

    } catch (error) {
        throw new Error(`OpenAI API error: ${error.message}`);
    }
}

async function generateCartoonWithDallE(prompt, originalBase64) {
    // For DALL-E 3, we'll create a prompt that describes what we want
    // Since DALL-E can't edit images, we'll use the original as reference

    const apiUrl = 'https://api.openai.com/v1/images/edits';

    try {
        // Convert base64 to file
        const imageBlob = await (await fetch(`data:image/jpeg;base64,${originalBase64}`)).blob();
        const imageFile = new File([imageBlob], 'image.png', { type: 'image/png' });

        // Create a transparent mask (same size as image)
        const canvas = document.createElement('canvas');
        const img = new Image();

        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = `data:image/jpeg;base64,${originalBase64}`;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Create a semi-transparent mask
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const maskBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('mask', maskFile);
        formData.append('prompt', 'Transform this into a vibrant cartoon style with bold outlines and bright colors');
        formData.append('n', '1');
        formData.append('size', '1024x1024');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${gameState.apiToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Image edit failed');
        }

        const data = await response.json();
        return data.data[0].url;

    } catch (error) {
        // Fallback: If DALL-E edit fails, just use the original image
        // In a production app, you might want to use a different service
        console.error('DALL-E edit failed:', error);
        alert('Note: Using original image as cartoon transformation. For best results, ensure your API key has access to image editing features.');
        return `data:image/jpeg;base64,${originalBase64}`;
    }
}

// Puzzle Game Logic
function updateDifficulty() {
    gameState.difficulty = parseInt(elements.difficultySelect.value);
}

function startPuzzleGame() {
    if (!gameState.cartoonImage) return;

    elements.puzzleSection.style.display = 'block';
    elements.victoryMessage.style.display = 'none';
    elements.puzzleSection.scrollIntoView({ behavior: 'smooth' });

    createPuzzle();
}

function createPuzzle() {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
        const size = gameState.difficulty;
        const pieceWidth = img.width / size;
        const pieceHeight = img.height / size;

        // Clear previous puzzle
        elements.puzzleGrid.innerHTML = '';
        elements.piecesPool.innerHTML = '';
        gameState.pieces = [];
        gameState.grid = [];

        // Set grid layout
        elements.puzzleGrid.style.gridTemplateColumns = `repeat(${size}, ${pieceWidth}px)`;
        elements.puzzleGrid.style.gridTemplateRows = `repeat(${size}, ${pieceHeight}px)`;

        // Create pieces
        const pieces = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const pieceId = row * size + col;

                // Create piece element
                const piece = createPieceElement(img, col, row, pieceWidth, pieceHeight, pieceId);
                pieces.push({ element: piece, correctRow: row, correctCol: col, id: pieceId });

                // Create slot in grid
                const slot = createSlotElement(row, col);
                gameState.grid.push({ element: slot, row, col, piece: null });
            }
        }

        // Shuffle pieces
        gameState.pieces = shuffleArray(pieces);

        // Add pieces to pool
        gameState.pieces.forEach(piece => {
            elements.piecesPool.appendChild(piece.element);
        });
    };

    img.src = gameState.cartoonImage;
}

function createPieceElement(img, col, row, width, height, id) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        img,
        col * width, row * height, width, height,
        0, 0, width, height
    );

    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.style.width = width + 'px';
    piece.style.height = height + 'px';
    piece.style.backgroundImage = `url(${canvas.toDataURL()})`;
    piece.draggable = true;
    piece.dataset.pieceId = id;

    // Drag events
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('dragend', handleDragEnd);

    return piece;
}

function createSlotElement(row, col) {
    const slot = document.createElement('div');
    slot.className = 'puzzle-slot';
    slot.dataset.row = row;
    slot.dataset.col = col;

    // Drop events
    slot.addEventListener('dragover', handleDragOver);
    slot.addEventListener('dragleave', handleDragLeave);
    slot.addEventListener('drop', handleDrop);

    elements.puzzleGrid.appendChild(slot);
    return slot;
}

// Drag and Drop Handlers
let draggedPiece = null;

function handleDragStart(e) {
    draggedPiece = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    this.classList.remove('drag-over');

    if (!draggedPiece) return false;

    const slot = this;
    const slotData = gameState.grid.find(g => g.element === slot);

    // If slot already has a piece, return the piece to pool
    if (slotData.piece) {
        elements.piecesPool.appendChild(slotData.piece);
    }

    // Remove piece from its current location
    if (draggedPiece.parentElement.classList.contains('puzzle-slot')) {
        const oldSlot = gameState.grid.find(g => g.piece === draggedPiece);
        if (oldSlot) oldSlot.piece = null;
    }

    // Place piece in slot
    slot.appendChild(draggedPiece);
    slot.classList.add('filled');
    slotData.piece = draggedPiece;

    // Check if puzzle is complete
    checkPuzzleComplete();

    return false;
}

// Utility Functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function checkPuzzleComplete() {
    let isComplete = true;

    for (const slot of gameState.grid) {
        if (!slot.piece) {
            isComplete = false;
            break;
        }

        const pieceId = parseInt(slot.piece.dataset.pieceId);
        const correctPiece = gameState.pieces.find(p => p.id === pieceId);

        if (correctPiece.correctRow !== slot.row || correctPiece.correctCol !== slot.col) {
            isComplete = false;
            break;
        }
    }

    if (isComplete) {
        showVictory();
    }
}

function showVictory() {
    elements.victoryMessage.style.display = 'block';
    elements.victoryMessage.scrollIntoView({ behavior: 'smooth' });
}

// Game Controls
function showPreview() {
    elements.previewImage.src = gameState.cartoonImage;
    elements.previewModal.style.display = 'flex';
}

function closePreview() {
    elements.previewModal.style.display = 'none';
}

function resetPuzzle() {
    if (!confirm('Are you sure you want to reset the puzzle?')) return;

    // Move all pieces back to pool
    gameState.grid.forEach(slot => {
        if (slot.piece) {
            elements.piecesPool.appendChild(slot.piece);
            slot.piece = null;
            slot.element.classList.remove('filled');
        }
    });

    // Re-shuffle pieces
    const pieceElements = Array.from(elements.piecesPool.children);
    shuffleArray(pieceElements).forEach(piece => {
        elements.piecesPool.appendChild(piece);
    });

    elements.victoryMessage.style.display = 'none';
}

function newGame() {
    // Reset all sections
    elements.previewSection.style.display = 'none';
    elements.cartoonSection.style.display = 'none';
    elements.puzzleSection.style.display = 'none';
    elements.victoryMessage.style.display = 'none';

    // Clear images
    gameState.originalImage = null;
    gameState.cartoonImage = null;
    elements.originalImage.src = '';
    elements.cartoonImage.src = '';
    elements.fileInput.value = '';

    // Stop camera if running
    if (gameState.currentStream) {
        gameState.currentStream.getTracks().forEach(track => track.stop());
        elements.camera.style.display = 'none';
        elements.captureBtn.style.display = 'none';
        elements.cameraBtn.style.display = 'block';
        elements.uploadBtn.style.display = 'block';
    }

    // Scroll to top
    elements.uploadSection.scrollIntoView({ behavior: 'smooth' });
}
