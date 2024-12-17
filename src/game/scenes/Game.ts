import { Scene } from "phaser";
import { Player } from "../ecs/entities/Player";
import { Wall } from "../ecs/entities/Wall";
import {
    PlayerControlSystem,
    WeaponSystem,
    CollisionSystem,
} from "../ecs/systems/System";
import { WeaponComponent } from "../ecs/components/Component";
import { EventBus } from "../EventBus";

export class Game extends Scene {
    private player: Player;
    private systems: System[] = [];
    private gridTiles: Phaser.GameObjects.TileSprite;
    private ammoText: Phaser.GameObjects.Text;
    private readonly WORLD_SIZE = 2000; // -1000 to 1000 in both directions

    constructor() {
        super({
            key: "Game",
            physics: {
                arcade: {
                    debug: false,
                    gravity: { x: 0, y: 0 },
                },
            },
        });
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor("#1a1a1a");

        // Set up world bounds
        this.physics.world.setBounds(
            -this.WORLD_SIZE / 2,
            -this.WORLD_SIZE / 2,
            this.WORLD_SIZE,
            this.WORLD_SIZE
        );

        // Create grid background (fixed, not parallax)
        const gridSize = 32;
        this.gridTiles = this.add
            .tileSprite(
                -this.WORLD_SIZE / 2,
                -this.WORLD_SIZE / 2,
                this.WORLD_SIZE,
                this.WORLD_SIZE,
                "grid"
            )
            .setOrigin(0, 0)
            .setDepth(-1); // Ensure grid is behind everything

        // Initialize systems
        this.systems = [
            new PlayerControlSystem(this),
            new WeaponSystem(this),
            new CollisionSystem(this),
        ];

        // Create player
        this.player = new Player(this, 0, 0); // Start at center

        // Add player to systems
        this.systems.forEach((system) => system.addEntity(this.player));

        // Create walls
        this.createRandomWalls();

        // Set up camera to follow player
        this.cameras.main.startFollow(this.player.gameObject);
        this.cameras.main.setZoom(1);

        // Create ammo display
        this.setupAmmoDisplay();

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number) {
        // Update all systems
        this.systems.forEach((system) => system.update(time, delta));

        // Update ammo display
        this.updateAmmoDisplay();
    }

    private createRandomWalls() {
        const numWalls = Phaser.Math.Between(15, 25); // Random number of walls
        const minSize = 50;
        const maxSize = 200;
        const margin = 100; // Margin from center to avoid spawning on player

        for (let i = 0; i < numWalls; i++) {
            // Generate random position (avoiding center area where player spawns)
            let x, y;
            do {
                x = Phaser.Math.Between(
                    -this.WORLD_SIZE / 2 + maxSize,
                    this.WORLD_SIZE / 2 - maxSize
                );
                y = Phaser.Math.Between(
                    -this.WORLD_SIZE / 2 + maxSize,
                    this.WORLD_SIZE / 2 - maxSize
                );
            } while (Math.abs(x) < margin && Math.abs(y) < margin);

            // Random size
            const width = Phaser.Math.Between(minSize, maxSize);
            const height = Phaser.Math.Between(minSize, maxSize);

            // Create wall and add to systems
            const wall = new Wall(this, x, y, width, height);
            this.systems.forEach((system) => system.addEntity(wall));
        }
    }

    private setupAmmoDisplay() {
        this.ammoText = this.add
            .text(16, 16, "", {
                fontSize: "32px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setScrollFactor(0);
    }

    private updateAmmoDisplay() {
        const weaponComponent = this.player.getComponent(WeaponComponent);
        if (weaponComponent) {
            const text = weaponComponent.isReloading
                ? "Reloading..."
                : `Ammo: ${weaponComponent.currentAmmo}/${weaponComponent.maxAmmo}`;
            this.ammoText.setText(text);
        }
    }

    changeScene(newScene: string) {
        this.scene.start(newScene);
    }
}

