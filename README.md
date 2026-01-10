# Web-Based Games Collection

A collection of simple, fun web-based games that run directly in your browser.

## Games

### Jigsaw Puzzle Game
An interactive jigsaw puzzle game that transforms your photos into cartoon-style artwork using OpenAI's API, then breaks them into puzzle pieces for you to reassemble!

**Features:**
- Upload images or take photos with your camera
- AI-powered cartoon style transformation using OpenAI API
- Multiple difficulty levels (2x2 to 5x5 pieces)
- Drag-and-drop puzzle assembly
- Preview button to see the completed image
- Victory celebration when puzzle is complete
- Secure local storage of API token

**How to Play:**
1. Open `jigsaw/index.html` in your web browser
2. Enter your OpenAI API token (stored securely in browser)
3. Upload a photo or take one with your camera
4. Transform the image into cartoon style using AI
5. Start the puzzle game and drag pieces to their correct positions
6. Complete the puzzle to win!

**Requirements:**
- An OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))
- Modern web browser with camera access (for photo capture feature)

### Coloring Game
A canvas-based coloring game featuring a balloon design. Pick your favorite colors from the palette and bring the image to life!

**Features:**
- Color palette with 12 different colors
- Eraser tool
- Reset button to start over
- Simple click-to-color interface

**How to Play:**
1. Open `coloring/index.html` in your web browser
2. Select a color from the palette
3. Click on areas of the balloon to color them
4. Use the eraser to undo mistakes
5. Click reset to start fresh

## Getting Started

Simply clone the repository and open any game's `index.html` file in your web browser:

```bash
git clone <repository-url>
cd games
# Open any game, for example:
open coloring/index.html  # macOS
# or
xdg-open coloring/index.html  # Linux
# or just double-click the file in your file explorer
```

## License

See the [LICENSE](LICENSE) file for details.
