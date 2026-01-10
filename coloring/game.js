const canvas = document.getElementById('coloringCanvas');
const ctx = canvas.getContext('2d');
let currentColor = '#FF0000';
let isEraser = false;

// Store regions that can be colored
const regions = [];

// Scale factor to fit the SVG (800x1000) into canvas (800x600)
const scale = 0.6;

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

    ctx.save();
    ctx.scale(scale, scale);

    ctx.lineWidth = 6 / scale; // Adjust line width for scaling
    ctx.strokeStyle = '#000000';

    // Balloon - main ellipse
    ctx.beginPath();
    ctx.ellipse(400, 320, 190, 250, 0, 0, Math.PI * 2);
    ctx.stroke();
    regions.push({
        type: 'ellipse',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.ellipse(400, 320, 190, 250, 0, 0, Math.PI * 2);
        }
    });
    regions[regions.length - 1].draw();

    // Balloon left panel
    ctx.beginPath();
    ctx.moveTo(400, 70);
    ctx.bezierCurveTo(330, 180, 330, 470, 400, 570);
    ctx.stroke();

    // Balloon right panel
    ctx.beginPath();
    ctx.moveTo(400, 70);
    ctx.bezierCurveTo(470, 180, 470, 470, 400, 570);
    ctx.stroke();

    // Balloon knot (triangle)
    ctx.beginPath();
    ctx.moveTo(380, 580);
    ctx.lineTo(420, 580);
    ctx.lineTo(400, 620);
    ctx.closePath();
    ctx.stroke();
    regions.push({
        type: 'knot',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(380, 580);
            this.path.lineTo(420, 580);
            this.path.lineTo(400, 620);
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();

    // Left string
    ctx.lineWidth = 4 / scale;
    ctx.beginPath();
    ctx.moveTo(380, 620);
    ctx.bezierCurveTo(340, 700, 320, 780, 310, 850);
    ctx.stroke();

    // Right string
    ctx.beginPath();
    ctx.moveTo(420, 620);
    ctx.bezierCurveTo(460, 700, 480, 780, 490, 850);
    ctx.stroke();

    // Basket
    ctx.lineWidth = 6 / scale;
    ctx.beginPath();
    ctx.roundRect(290, 850, 220, 130, 12);
    ctx.stroke();
    regions.push({
        type: 'basket',
        path: new Path2D(),
        draw: function() {
            this.path = new Path2D();
            this.path.roundRect(290, 850, 220, 130, 12);
        }
    });
    regions[regions.length - 1].draw();

    // Basket weave
    ctx.lineWidth = 4 / scale;
    ctx.beginPath();
    ctx.moveTo(290, 890);
    ctx.lineTo(510, 890);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(290, 930);
    ctx.lineTo(510, 930);
    ctx.stroke();

    // Big cloud left
    ctx.lineWidth = 5 / scale;
    drawCloud(
        [90, 260],
        [
            [40, 260, 40, 340, 110, 340],
            [130, 400, 240, 400, 260, 340],
            [330, 340, 330, 270, 260, 270],
            [240, 200, 140, 200, 130, 260]
        ]
    );

    // Big cloud right
    drawCloud(
        [480, 180],
        [
            [420, 180, 420, 260, 500, 260],
            [520, 330, 640, 330, 660, 260],
            [730, 260, 730, 190, 660, 190],
            [640, 120, 540, 120, 520, 180]
        ]
    );

    // Stars
    drawStarPolygon([150,100, 160,130, 190,140, 160,150, 150,180, 140,150, 110,140, 140,130]);
    drawStarPolygon([650,90, 660,115, 685,125, 660,135, 650,160, 640,135, 615,125, 640,115]);
    drawStarPolygon([300,150, 308,168, 328,176, 308,184, 300,202, 292,184, 272,176, 292,168]);

    ctx.restore();
}

function drawCloud(start, curves) {
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);

    // Draw bezier curves
    curves.forEach(curve => {
        ctx.bezierCurveTo(curve[0], curve[1], curve[2], curve[3], curve[4], curve[5]);
    });

    ctx.closePath();
    ctx.stroke();

    // Add to regions
    regions.push({
        type: 'cloud',
        path: new Path2D(),
        start: start,
        curves: curves,
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(this.start[0], this.start[1]);
            this.curves.forEach(curve => {
                this.path.bezierCurveTo(curve[0], curve[1], curve[2], curve[3], curve[4], curve[5]);
            });
            this.path.closePath();
        }
    });
    regions[regions.length - 1].draw();
}

function drawStarPolygon(points) {
    ctx.lineWidth = 4 / scale;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i+1]);
    }
    ctx.closePath();
    ctx.stroke();

    regions.push({
        type: 'star',
        path: new Path2D(),
        points: points,
        draw: function() {
            this.path = new Path2D();
            this.path.moveTo(this.points[0], this.points[1]);
            for (let i = 2; i < this.points.length; i += 2) {
                this.path.lineTo(this.points[i], this.points[i+1]);
            }
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
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

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
    ctx.save();
    ctx.scale(scale, scale);

    if (isEraser) {
        ctx.fillStyle = 'white';
    } else {
        ctx.fillStyle = currentColor;
    }

    ctx.fill(region.path);

    // Redraw all strokes to maintain outline
    redrawOutlines();

    ctx.restore();
}

// Redraw all the outlines
function redrawOutlines() {
    ctx.lineWidth = 6 / scale;
    ctx.strokeStyle = '#000000';

    regions.forEach(region => {
        if (region.type === 'cloud' || region.type === 'star') {
            ctx.lineWidth = 4 / scale;
        } else if (region.type === 'knot') {
            ctx.lineWidth = 6 / scale;
        } else {
            ctx.lineWidth = 6 / scale;
        }
        ctx.stroke(region.path);
    });
}

// Start the game
init();
