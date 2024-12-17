import { Scene } from "phaser";
import { Player } from "../ecs/entities/Player";
import { Wall } from "../ecs/entities/Wall";
import { Enemy } from "../ecs/entities/Enemy";
import {
    PlayerControlSystem,
    WeaponSystem,
    CollisionSystem,
} from "../ecs/systems/System";
import { EnemySystem } from "../ecs/systems/EnemySystem";
import { BulletCollisionSystem } from "../ecs/systems/BulletCollisionSystem";
import { UISystem } from "../ecs/systems/UISystem";
import { WeaponComponent } from "../ecs/components/Component";
import { EventBus } from "../EventBus";

export class Game extends Scene {
    private player: Player;
    private systems: System[] = [];
    private gridTiles: Phaser.GameObjects.TileSprite;
    private ammoText: Phaser.GameObjects.Text;
    private minimap: Phaser.Cameras.Scene2D.Camera;
    private minimapBorder: Phaser.GameObjects.Graphics;
    private readonly WORLD_SIZE = 8000;
    private readonly CAMERA_ZOOM = 0.8;
    private readonly MINIMAP_SIZE = 200;
    private walls: Wall[] = [];
    private enemies: Enemy[] = [];
    private enemySystem: EnemySystem;

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
        // Set up cameras first
        this.cameras.main.setBackgroundColor("#1a1a1a");
        this.cameras.main.setZoom(this.CAMERA_ZOOM);

        // Set up world bounds
        this.physics.world.setBounds(
            -this.WORLD_SIZE / 2,
            -this.WORLD_SIZE / 2,
            this.WORLD_SIZE,
            this.WORLD_SIZE
        );

        // Create grid background (fixed, not parallax)
        const gridSize = 64;
        this.gridTiles = this.add
            .tileSprite(
                -this.WORLD_SIZE / 2,
                -this.WORLD_SIZE / 2,
                this.WORLD_SIZE,
                this.WORLD_SIZE,
                "grid"
            )
            .setOrigin(0, 0)
            .setDepth(-1);

        // Create player first
        this.player = new Player(this, 0, 0);

        // Initialize enemy system
        this.enemySystem = new EnemySystem(this);
        this.enemySystem.setPlayer(this.player);

        // Create bullet collision system first
        const bulletCollisionSystem = new BulletCollisionSystem(this);

        // Initialize systems
        this.systems = [
            new PlayerControlSystem(this),
            new WeaponSystem(this),
            new CollisionSystem(this),
            this.enemySystem,
            bulletCollisionSystem,
            new UISystem(this),
        ];

        // Add player to systems
        this.systems.forEach((system) => system.addEntity(this.player));

        // Create walls and enemies
        this.createRandomWalls();
        this.createEnemies();

        // Set up camera follow
        this.cameras.main.startFollow(this.player.gameObject);

        // Create UI elements
        this.setupUI();

        // Listen for bullet creation
        this.events.on("bullet-created", (bullet: Entity) => {
            this.systems.forEach((system) => system.addEntity(bullet));
        });

        // Listen for enemy destruction
        this.events.on("enemy-destroyed", (enemy: Entity) => {
            // Remove from enemies array
            const index = this.enemies.findIndex((e) => e === enemy);
            if (index !== -1) {
                this.enemies.splice(index, 1);
            }

            // Remove from all systems
            this.systems.forEach((system) => system.removeEntity(enemy));
        });

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number) {
        // Update all systems
        this.systems.forEach((system) => system.update(time, delta));

        // Update ammo display
        this.updateAmmoDisplay();
    }

    private setupUI() {
        // Setup ammo display first
        this.setupAmmoDisplay();

        // Then setup minimap
        this.setupMinimap();
    }

    private setupMinimap() {
        const minimapX = this.scale.width - this.MINIMAP_SIZE - 20;
        const minimapY = 20;
        const DOT_SIZE = 80; // Consistent size for all dots

        // Create minimap camera
        this.minimap = this.cameras.add(
            minimapX,
            minimapY,
            this.MINIMAP_SIZE,
            this.MINIMAP_SIZE
        );

        // Configure minimap camera
        this.minimap
            .setZoom(this.MINIMAP_SIZE / this.WORLD_SIZE)
            .setBackgroundColor(0x000000)
            .setAlpha(0.8)
            .setBounds(
                -this.WORLD_SIZE / 2,
                -this.WORLD_SIZE / 2,
                this.WORLD_SIZE,
                this.WORLD_SIZE
            )
            .setName("minimap");

        // Create border for minimap
        this.minimapBorder = this.add
            .graphics()
            .lineStyle(2, 0xffffff)
            .strokeRect(
                minimapX,
                minimapY,
                this.MINIMAP_SIZE,
                this.MINIMAP_SIZE
            )
            .setScrollFactor(0)
            .setDepth(100);

        // Make minimap ignore UI elements
        this.minimap.ignore([this.minimapBorder, this.ammoText]);

        // Create a graphics object for the player and enemy dots
        const minimapDots = this.add.graphics().setDepth(1);

        // Make main camera ignore the dots
        this.cameras.main.ignore(minimapDots);

        // Update dots position in the game loop
        this.events.on("update", () => {
            // Clear previous dots
            minimapDots.clear();

            // Draw player dot (green)
            if (this.player?.gameObject) {
                minimapDots
                    .fillStyle(0x00ff00)
                    .fillCircle(
                        this.player.gameObject.x,
                        this.player.gameObject.y,
                        DOT_SIZE
                    );
            }

            // Draw enemy dots (red)
            minimapDots.fillStyle(0xff0000);
            this.enemies.forEach((enemy) => {
                if (enemy.gameObject) {
                    minimapDots.fillCircle(
                        enemy.gameObject.x,
                        enemy.gameObject.y,
                        DOT_SIZE
                    );
                }
            });
        });
    }

    private createRandomWalls() {
        const numWalls = Phaser.Math.Between(50, 60);
        const minSize = 200;
        const maxSize = 600;
        const margin = 400;

        for (let i = 0; i < numWalls; i++) {
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

            const width = Phaser.Math.Between(minSize, maxSize);
            const height = Phaser.Math.Between(minSize, maxSize);

            const wall = new Wall(this, x, y, width, height);
            this.walls.push(wall);
            this.systems.forEach((system) => system.addEntity(wall));
        }
    }

    private createEnemies() {
        const numEnemies = 30;
        const margin = 600; // Keep enemies away from spawn point

        for (let i = 0; i < numEnemies; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(
                    -this.WORLD_SIZE / 2 + margin,
                    this.WORLD_SIZE / 2 - margin
                );
                y = Phaser.Math.Between(
                    -this.WORLD_SIZE / 2 + margin,
                    this.WORLD_SIZE / 2 - margin
                );
            } while (Math.abs(x) < margin && Math.abs(y) < margin);

            const enemy = new Enemy(this, x, y);
            this.enemies.push(enemy);
            this.systems.forEach((system) => system.addEntity(enemy));
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
            .setScrollFactor(0)
            .setDepth(100);
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

