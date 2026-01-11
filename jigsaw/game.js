// Game State
let gameState = {
    originalImage: null,
    cartoonImage: null,
    difficulty: 3,
    pieces: [],
    grid: [],
    currentStream: null,
    apiToken: null
};

// DOM Elements
const elements = {
    gameContainer: document.getElementById('gameContainer'),
    setupContainer: document.getElementById('setupContainer'),

    tokenModal: document.getElementById('tokenModal'),
    apiTokenInput: document.getElementById('apiTokenInput'),
    saveTokenBtn: document.getElementById('saveTokenBtn'),
    changeTokenBtn: document.getElementById('changeTokenBtn'),

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

// Helper function to switch between setup steps
function showStep(stepElement) {
    // Remove active class from all steps
    const allSteps = elements.setupContainer.querySelectorAll('.step-content');
    allSteps.forEach(step => step.classList.remove('active'));

    // Add active class to the target step
    stepElement.classList.add('active');

    // Scroll to setup container
    elements.setupContainer.scrollIntoView({ behavior: 'smooth' });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Check for saved token
    const savedToken = localStorage.getItem('openai_token');
    if (savedToken) {
        gameState.apiToken = savedToken;
        elements.changeTokenBtn.style.display = 'block';
    } else {
        elements.tokenModal.style.display = 'flex';
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
    alert('Token saved successfully!');
}

function changeToken() {
    elements.apiTokenInput.value = '';
    elements.tokenModal.style.display = 'flex';
}

// Image Upload/Capture
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
    }

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
    showStep(elements.previewSection);
}

// Image Transformation with OpenAI
async function transformImage() {
    if (!gameState.apiToken) {
        alert('Please set your OpenAI API token first');
        elements.tokenModal.style.display = 'flex';
        return;
    }

    showStep(elements.loadingIndicator);

    try {
        // Step 1: Analyze image with GPT-4 Vision
        const description = await analyzeImageWithVision(gameState.originalImage);
        console.log('Image analysis:', description);

        // Step 2: Generate cartoon with DALL-E 3 (returns base64 data URL)
        const cartoonBase64 = await generateCartoonFromDescription(description);
        console.log('Cartoon generated (base64)');

        // Store the base64 data
        gameState.cartoonImage = cartoonBase64;

        // Show the cartoon image
        elements.cartoonImage.src = cartoonBase64;
        showStep(elements.cartoonSection);

    } catch (error) {
        console.error('Transformation error:', error);
        showStep(elements.previewSection);

        let errorMessage = 'Failed to transform image: ' + error.message;

        if (error.message.includes('401') || error.message.includes('authentication')) {
            errorMessage += '\n\nYour API token may be invalid. Please check it and try again.';
            elements.tokenModal.style.display = 'flex';
        } else if (error.message.includes('quota') || error.message.includes('429')) {
            errorMessage += '\n\nYou may have exceeded your API quota. Please check your OpenAI account.';
        }

        alert(errorMessage);
    }
}

async function analyzeImageWithVision(imageData) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gameState.apiToken}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this image and provide a detailed description for creating a cartoon version. Focus on: main subjects, their characteristics, setting, colors, and mood. Be specific and detailed. Keep it under 300 words.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageData
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Vision API error (${response.status}): ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function generateCartoonFromDescription(description) {
    const cartoonPrompt = `Create a vibrant, colorful cartoon illustration based on this description: ${description}. Style: bright colors, clear outlines, playful and fun cartoon art style, suitable for a jigsaw puzzle game.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gameState.apiToken}`
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: cartoonPrompt,
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
    // Return base64 data as a data URL
    return `data:image/png;base64,${data.data[0].b64_json}`;
}

// Puzzle Game Logic
function updateDifficulty() {
    gameState.difficulty = parseInt(elements.difficultySelect.value);
}

function startPuzzleGame() {
    // Use cartoon image if available, otherwise use original
    const puzzleImage = gameState.cartoonImage || gameState.originalImage;
    if (!puzzleImage) return;

    // Hide setup container and show puzzle section
    elements.setupContainer.style.display = 'none';
    elements.puzzleSection.style.display = 'block';
    elements.victoryMessage.style.display = 'none';
    elements.puzzleSection.scrollIntoView({ behavior: 'smooth' });

    createPuzzle();
}

function createPuzzle() {
    const img = new Image();

    img.onload = () => {
        // Ensure image has valid dimensions
        if (!img.width || !img.height) {
            console.error('Image loaded but has invalid dimensions:', img.width, img.height);
            alert('Error: Image has invalid dimensions. Please try a different image.');
            return;
        }

        const size = gameState.difficulty;

        // Calculate maximum available space for puzzle
        // Account for viewport, container padding, and pieces pool
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Reserve space for padding, header, controls, and pieces pool
        // On mobile, puzzle is stacked vertically, on desktop horizontally
        const isMobile = viewportWidth <= 768;
        const maxPuzzleWidth = isMobile
            ? Math.min(viewportWidth - 60, 600)  // Full width minus padding
            : Math.min(viewportWidth * 0.55, 700); // 55% of viewport, max 700px
        const maxPuzzleHeight = isMobile
            ? Math.min(viewportHeight * 0.45, 500) // 45% of viewport for mobile
            : Math.min(viewportHeight * 0.65, 600); // 65% of viewport for desktop

        // Calculate scaled dimensions while maintaining aspect ratio
        const imgAspectRatio = img.width / img.height;
        let puzzleWidth, puzzleHeight;

        if (imgAspectRatio > maxPuzzleWidth / maxPuzzleHeight) {
            // Width is the limiting factor
            puzzleWidth = maxPuzzleWidth;
            puzzleHeight = maxPuzzleWidth / imgAspectRatio;
        } else {
            // Height is the limiting factor
            puzzleHeight = maxPuzzleHeight;
            puzzleWidth = maxPuzzleHeight * imgAspectRatio;
        }

        // Calculate piece dimensions based on scaled puzzle size
        const pieceWidth = Math.floor(puzzleWidth / size);
        const pieceHeight = Math.floor(puzzleHeight / size);

        // Adjust puzzle dimensions to exact grid size
        const actualPuzzleWidth = pieceWidth * size;
        const actualPuzzleHeight = pieceHeight * size;

        console.log('Creating puzzle:', {
            originalImageSize: `${img.width}x${img.height}`,
            maxAvailableSpace: `${maxPuzzleWidth}x${maxPuzzleHeight}`,
            scaledPuzzleSize: `${actualPuzzleWidth}x${actualPuzzleHeight}`,
            gridSize: `${size}x${size}`,
            pieceSize: `${pieceWidth}x${pieceHeight}`,
            isMobile: isMobile
        });

        // Clear previous puzzle
        elements.puzzleGrid.innerHTML = '';
        elements.piecesPool.innerHTML = '';
        gameState.pieces = [];
        gameState.grid = [];

        // Set grid layout with responsive dimensions
        elements.puzzleGrid.style.gridTemplateColumns = `repeat(${size}, ${pieceWidth}px)`;
        elements.puzzleGrid.style.gridTemplateRows = `repeat(${size}, ${pieceHeight}px)`;

        // Create pieces
        const pieces = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const pieceId = row * size + col;

                // Create piece element
                const piece = createPieceElement(img, col, row, pieceWidth, pieceHeight, pieceId, size);
                pieces.push({ element: piece, correctRow: row, correctCol: col, id: pieceId });

                // Create slot in grid
                const slot = createSlotElement(row, col);
                gameState.grid.push({ element: slot, row, col, piece: null });
            }
        }

        console.log('Created pieces:', pieces.length);

        // Shuffle pieces
        gameState.pieces = shuffleArray(pieces);

        // Add pieces to pool
        gameState.pieces.forEach(piece => {
            elements.piecesPool.appendChild(piece.element);
        });

        console.log('Puzzle created successfully');
    };

    img.onerror = (error) => {
        console.error('Failed to load image for puzzle:', error);
        alert('Error: Failed to load image. Please try uploading a different image.');
    };

    // Use cartoon image if available, otherwise use original
    img.src = gameState.cartoonImage || gameState.originalImage;
}

function createPieceElement(img, col, row, width, height, id, gridSize) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Calculate source dimensions from original image
    const sourceWidth = img.width / gridSize;
    const sourceHeight = img.height / gridSize;
    const sourceX = col * sourceWidth;
    const sourceY = row * sourceHeight;

    // Draw scaled portion of image to canvas
    ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle from original image
        0, 0, width, height  // Destination rectangle on canvas (scaled)
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
    // Show cartoon image if available, otherwise show original
    elements.previewImage.src = gameState.cartoonImage || gameState.originalImage;
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
    // Show setup container and hide puzzle section
    elements.setupContainer.style.display = 'block';
    elements.puzzleSection.style.display = 'none';
    elements.victoryMessage.style.display = 'none';

    // Reset to upload step
    showStep(elements.uploadSection);

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
}
