const canvas = document.getElementById('coloringCanvas');
const ctx = canvas.getContext('2d');
let currentColor = '#FF0000';
let isEraser = false;

// Store regions that can be colored
const regions = [];

// Initialize the game
function init() {
    drawBalloon();
    setupEventListeners();
    // Pre-select the first color
    document.querySelector('.color-btn').classList.add('active');
}

// Draw the balloon outline and create fillable regions
function drawBalloon() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';

    // Hot air balloon envelope (main balloon)
    const centerX = 400;
    const centerY = 250;
    const balloonWidth = 200;
    const balloonHeight = 220;

    // Draw balloon envelope sections
    // Left red section
    ctx.beginPath();
    ctx.moveTo(centerX - balloonWidth/2, centerY);
    ctx.quadraticCurveTo(centerX - balloonWidth/2, centerY - balloonHeight/2, centerX - balloonWidth/6, centerY - balloonHeight/2);
    ctx.lineTo(centerX - balloonWidth/6, centerY + balloonHeight/3);
    ctx.quadraticCurveTo(centerX - balloonWidth/3, centerY + balloonHeight/2, centerX - balloonWidth/2, centerY);
    ctx.closePath();
    ctx.stroke();
    regions.push({
        type: 'path',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(centerX - balloonWidth/2, centerY);
            this.path.quadraticCurveTo(centerX - balloonWidth/2, centerY - balloonHeight/2, centerX - balloonWidth/6, centerY - balloonHeight/2);
            this.path.lineTo(centerX - balloonWidth/6, centerY + balloonHeight/3);
            this.path.quadraticCurveTo(centerX - balloonWidth/3, centerY + balloonHeight/2, centerX - balloonWidth/2, centerY);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();

    // Left-center green section
    ctx.beginPath();
    ctx.moveTo(centerX - balloonWidth/6, centerY - balloonHeight/2);
    ctx.lineTo(centerX, centerY - balloonHeight/2);
    ctx.lineTo(centerX, centerY + balloonHeight/3);
    ctx.lineTo(centerX - balloonWidth/6, centerY + balloonHeight/3);
    ctx.closePath();
    ctx.stroke();
    regions.push({
        type: 'path',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(centerX - balloonWidth/6, centerY - balloonHeight/2);
            this.path.lineTo(centerX, centerY - balloonHeight/2);
            this.path.lineTo(centerX, centerY + balloonHeight/3);
            this.path.lineTo(centerX - balloonWidth/6, centerY + balloonHeight/3);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();

    // Center blue section
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - balloonHeight/2);
    ctx.lineTo(centerX + balloonWidth/6, centerY - balloonHeight/2);
    ctx.lineTo(centerX + balloonWidth/6, centerY + balloonHeight/3);
    ctx.lineTo(centerX, centerY + balloonHeight/3);
    ctx.closePath();
    ctx.stroke();
    regions.push({
        type: 'path',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(centerX, centerY - balloonHeight/2);
            this.path.lineTo(centerX + balloonWidth/6, centerY - balloonHeight/2);
            this.path.lineTo(centerX + balloonWidth/6, centerY + balloonHeight/3);
            this.path.lineTo(centerX, centerY + balloonHeight/3);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();

    // Right yellow section
    ctx.beginPath();
    ctx.moveTo(centerX + balloonWidth/6, centerY - balloonHeight/2);
    ctx.quadraticCurveTo(centerX + balloonWidth/2, centerY - balloonHeight/2, centerX + balloonWidth/2, centerY);
    ctx.quadraticCurveTo(centerX + balloonWidth/3, centerY + balloonHeight/2, centerX + balloonWidth/6, centerY + balloonHeight/3);
    ctx.closePath();
    ctx.stroke();
    regions.push({
        type: 'path',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(centerX + balloonWidth/6, centerY - balloonHeight/2);
            this.path.quadraticCurveTo(centerX + balloonWidth/2, centerY - balloonHeight/2, centerX + balloonWidth/2, centerY);
            this.path.quadraticCurveTo(centerX + balloonWidth/3, centerY + balloonHeight/2, centerX + balloonWidth/6, centerY + balloonHeight/3);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();

    // Basket
    ctx.beginPath();
    ctx.rect(centerX - 40, centerY + balloonHeight/2 + 20, 80, 60);
    ctx.closePath();
    ctx.stroke();
    regions.push({
        type: 'path',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.rect(centerX - 40, centerY + balloonHeight/2 + 20, 80, 60);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();

    // Ropes connecting balloon to basket
    ctx.beginPath();
    ctx.moveTo(centerX - balloonWidth/6, centerY + balloonHeight/3);
    ctx.lineTo(centerX - 35, centerY + balloonHeight/2 + 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + balloonWidth/6, centerY + balloonHeight/3);
    ctx.lineTo(centerX + 35, centerY + balloonHeight/2 + 20);
    ctx.stroke();

    // Draw clouds
    drawCloud(150, 150);
    drawCloud(650, 200);
    drawCloud(700, 400);

    // Draw stars
    drawStar(100, 400, 5, 30, 15);
    drawStar(150, 480, 5, 25, 12);
    drawStar(680, 100, 5, 30, 15);
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 30, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 30, y + 10, 25, 0, Math.PI * 2);
    ctx.stroke();

    regions.push({
        type: 'cloud',
        x: x,
        y: y,
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.arc(x, y, 25, 0, Math.PI * 2);
            this.path.arc(x + 25, y - 10, 30, 0, Math.PI * 2);
            this.path.arc(x + 50, y, 25, 0, Math.PI * 2);
            this.path.arc(x + 30, y + 10, 25, 0, Math.PI * 2);
        }
    });
    regions[regions.length - 1].draw();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.stroke();

    regions.push({
        type: 'star',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            this.path.moveTo(cx, cy - outerRadius);

            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                this.path.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                this.path.lineTo(x, y);
                rot += step;
            }

            this.path.lineTo(cx, cy - outerRadius);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();
}

// Setup event listeners
function setupEventListeners() {
    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentColor = this.dataset.color;
            isEraser = false;

            // Update active state
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update selected color display
            document.getElementById('selectedColorBox').style.backgroundColor = currentColor;

            // Update eraser button
            document.getElementById('eraserBtn').style.background = '#667eea';
        });
    });

    // Eraser button
    document.getElementById('eraserBtn').addEventListener('click', function() {
        isEraser = !isEraser;
        if (isEraser) {
            this.style.background = '#ff9800';
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        } else {
            this.style.background = '#667eea';
        }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the drawing?')) {
            regions.length = 0;
            init();
        }
    });

    // Canvas click
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check which region was clicked
        for (let region of regions) {
            if (ctx.isPointInPath(region.path, x, y)) {
                fillRegion(region);
                break;
            }
        }
    });
}

// Fill a region with the selected color
function fillRegion(region) {
    if (isEraser) {
        ctx.fillStyle = 'white';
    } else {
        ctx.fillStyle = currentColor;
    }

    ctx.fill(region.path);

    // Redraw all strokes to maintain outline
    redrawOutlines();
}

// Redraw all the outlines
function redrawOutlines() {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';

    regions.forEach(region => {
        ctx.stroke(region.path);
    });
}

// Start the game
init();
