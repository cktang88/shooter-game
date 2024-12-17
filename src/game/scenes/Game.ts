import { EventBus } from "../EventBus";
import { Scene } from "phaser";

interface PlayerState {
    reloading: boolean;
    currentAmmo: number;
    maxAmmo: number;
    reloadTime: number;
    fireRate: number;
    lastFired: number;
}

export class Game extends Scene {
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private bullets: Phaser.GameObjects.Group;
    private playerState: PlayerState;
    private ammoText: Phaser.GameObjects.Text;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        R: Phaser.Input.Keyboard.Key;
    };
    private gridTiles: Phaser.GameObjects.TileSprite;

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

    init() {
        // Initialize player state
        this.playerState = {
            reloading: false,
            currentAmmo: 30,
            maxAmmo: 30,
            reloadTime: 2000, // 2 seconds
            fireRate: 100, // 100ms between shots
            lastFired: 0,
        };
    }

    create() {
        // Set background color first
        this.cameras.main.setBackgroundColor("#1a1a1a");

        // Set up the grid background
        this.gridTiles = this.add
            .tileSprite(0, 0, this.scale.width, this.scale.height, "grid")
            .setOrigin(0, 0)
            .setScrollFactor(0.5);

        // Create player
        this.player = this.physics.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            "player"
        );

        // Set up world bounds and collisions
        this.physics.world.setBounds(-1000, -1000, 2000, 2000);
        this.player.setCollideWorldBounds(true);

        // Create bullets group with physics
        this.bullets = this.add.group({
            classType: Phaser.GameObjects.Line,
            maxSize: 100,
            runChildUpdate: true,
        });

        // Set up camera to follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);

        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D,R") as any;

        // Create ammo display
        this.ammoText = this.add
            .text(16, 16, this.getAmmoText(), {
                fontSize: "32px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setScrollFactor(0);

        // Set up mouse input for shooting
        this.input.on("pointerdown", () => this.tryToShoot());
        this.input.on("pointerup", () => {
            // Handle pointer up if needed
        });

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number) {
        if (!this.player || !this.gridTiles) return;

        // Handle movement
        this.handlePlayerMovement();

        // Handle continuous shooting if mouse is held down
        if (this.input.activePointer.isDown) {
            this.tryToShoot();
        }

        // Handle reload
        if (
            this.wasdKeys.R.isDown &&
            !this.playerState.reloading &&
            this.playerState.currentAmmo < this.playerState.maxAmmo
        ) {
            this.startReload();
        }

        // Rotate player to face mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            pointer.x + this.cameras.main.scrollX,
            pointer.y + this.cameras.main.scrollY
        );
        this.player.setRotation(angle);

        // Update grid position for parallax effect
        this.gridTiles.setTilePosition(
            -this.cameras.main.scrollX * 0.3,
            -this.cameras.main.scrollY * 0.3
        );
    }

    private handlePlayerMovement() {
        if (!this.player) return;

        const speed = 300;
        const moveX =
            (this.wasdKeys.D.isDown ? 1 : 0) - (this.wasdKeys.A.isDown ? 1 : 0);
        const moveY =
            (this.wasdKeys.S.isDown ? 1 : 0) - (this.wasdKeys.W.isDown ? 1 : 0);

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const normalizedVector = new Phaser.Math.Vector2(
                moveX,
                moveY
            ).normalize();
            this.player.setVelocity(
                normalizedVector.x * speed,
                normalizedVector.y * speed
            );
        } else {
            this.player.setVelocity(moveX * speed, moveY * speed);
        }
    }

    private tryToShoot() {
        const time = this.time.now;
        if (
            !this.playerState.reloading &&
            this.playerState.currentAmmo > 0 &&
            time > this.playerState.lastFired + this.playerState.fireRate
        ) {
            this.shoot();
            this.playerState.lastFired = time;
        }
    }

    private shoot() {
        if (!this.player) return;

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            pointer.x + this.cameras.main.scrollX,
            pointer.y + this.cameras.main.scrollY
        );

        // Create bullet (line)
        const bulletLength = 20;
        const bulletSpeed = 2000;
        const bullet = this.add.line(
            this.player.x,
            this.player.y,
            0,
            0,
            Math.cos(angle) * bulletLength,
            Math.sin(angle) * bulletLength,
            0xffff00
        );

        bullet.setLineWidth(2);

        // Add physics to the bullet
        this.physics.add.existing(bullet, false);
        const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;

        // Set bullet velocity based on angle
        const velocity = this.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle),
            bulletSpeed
        );
        bulletBody.setVelocity(velocity.x, velocity.y);

        // Destroy bullet after 1 second
        this.time.delayedCall(1000, () => {
            bullet.destroy();
        });

        this.playerState.currentAmmo--;
        this.updateAmmoText();
    }

    private startReload() {
        this.playerState.reloading = true;
        this.ammoText.setText("Reloading...");

        this.time.delayedCall(this.playerState.reloadTime, () => {
            this.playerState.currentAmmo = this.playerState.maxAmmo;
            this.playerState.reloading = false;
            this.updateAmmoText();
        });
    }

    private getAmmoText() {
        return `Ammo: ${this.playerState.currentAmmo}/${this.playerState.maxAmmo}`;
    }

    private updateAmmoText() {
        this.ammoText.setText(this.getAmmoText());
    }
}

