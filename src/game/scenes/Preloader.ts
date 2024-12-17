import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 460 * progress;
        });
    }

    preload() {
        // Create a temporary canvas for the grid texture
        const gridSize = 32;
        const gridCanvas = document.createElement("canvas");
        gridCanvas.width = gridSize;
        gridCanvas.height = gridSize;
        const ctx = gridCanvas.getContext("2d");

        if (ctx) {
            // Draw grid
            ctx.strokeStyle = "#333333";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(gridSize, 0);
            ctx.lineTo(gridSize, gridSize);
            ctx.lineTo(0, gridSize);
            ctx.lineTo(0, 0);
            ctx.stroke();
        }

        // Create a temporary canvas for the player texture
        const playerCanvas = document.createElement("canvas");
        playerCanvas.width = 32;
        playerCanvas.height = 32;
        const playerCtx = playerCanvas.getContext("2d");

        if (playerCtx) {
            // Draw player (a circle)
            playerCtx.fillStyle = "#00ff00";
            playerCtx.beginPath();
            playerCtx.arc(16, 16, 12, 0, Math.PI * 2); // Circle centered at (16,16) with radius 12
            playerCtx.closePath();
            playerCtx.fill();

            // Add stroke
            playerCtx.strokeStyle = "#ffffff";
            playerCtx.lineWidth = 2;
            playerCtx.stroke();
        }

        // Add textures to the game
        this.textures.addCanvas("grid", gridCanvas);
        this.textures.addCanvas("player", playerCanvas);
    }

    create() {
        // Go directly to the game scene
        this.scene.start("Game");
    }
}

