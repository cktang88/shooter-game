import { Scene } from "phaser";
import { Entity } from "../entities/Entity";
import { Bullet } from "../entities/Bullet";
import {
    Component,
    PlayerControlledComponent,
    WeaponComponent,
    PhysicsBodyComponent,
    ColliderComponent,
    StaminaComponent,
    UIComponent,
    MovementStateComponent,
} from "../components/Component";

export abstract class System {
    protected entities: Set<Entity> = new Set();

    constructor(protected scene: Scene) {}

    addEntity(entity: Entity): void {
        if (this.canProcessEntity(entity)) {
            this.entities.add(entity);
        }
    }

    removeEntity(entity: Entity): void {
        this.entities.delete(entity);
    }

    abstract canProcessEntity(entity: Entity): boolean;
    abstract update(time: number, delta: number): void;
}

export class PlayerControlSystem extends System {
    private wasdKeys: { [key: string]: Phaser.Input.Keyboard.Key };
    private shiftKey: Phaser.Input.Keyboard.Key;
    private readonly NORMAL_SPEED = 300;
    private readonly SPRINT_SPEED = 600;

    constructor(scene: Scene) {
        super(scene);
        this.wasdKeys = scene.input.keyboard.addKeys("W,A,S,D,R") as any;
        this.shiftKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SHIFT
        );
    }

    canProcessEntity(entity: Entity): boolean {
        return (
            entity.hasComponent(PlayerControlledComponent) &&
            entity.hasComponent(PhysicsBodyComponent) &&
            entity.hasComponent(StaminaComponent) &&
            entity.hasComponent(MovementStateComponent)
        );
    }

    update(time: number, delta: number): void {
        this.entities.forEach((entity) => {
            const physicsBody = entity.getComponent(PhysicsBodyComponent);
            const stamina = entity.getComponent(StaminaComponent);
            const movementState = entity.getComponent(MovementStateComponent);
            const ui = entity.getComponent(UIComponent);
            if (!physicsBody || !stamina || !movementState) return;

            // Handle stamina regeneration/drain
            const isMoving =
                this.wasdKeys.W.isDown ||
                this.wasdKeys.A.isDown ||
                this.wasdKeys.S.isDown ||
                this.wasdKeys.D.isDown;
            const wantToSprint = this.shiftKey.isDown && isMoving;
            const canSprint = stamina.currentStamina > stamina.sprintThreshold;

            // Update movement state
            movementState.isMoving = isMoving;
            movementState.isSprinting = wantToSprint && canSprint;

            if (wantToSprint && canSprint) {
                // Drain stamina while sprinting
                stamina.currentStamina = Math.max(
                    0,
                    stamina.currentStamina -
                        (stamina.staminaDrain * delta) / 1000
                );
            } else if (!wantToSprint) {
                // Regenerate stamina when not sprinting
                stamina.currentStamina = Math.min(
                    stamina.maxStamina,
                    stamina.currentStamina +
                        (stamina.staminaRegen * delta) / 1000
                );
            }

            // Update UI if it exists
            if (ui) {
                ui.updateStaminaBar(stamina.currentStamina, stamina.maxStamina);
            }

            const speed =
                wantToSprint && canSprint
                    ? this.SPRINT_SPEED
                    : this.NORMAL_SPEED;
            const moveX =
                (this.wasdKeys.D.isDown ? 1 : 0) -
                (this.wasdKeys.A.isDown ? 1 : 0);
            const moveY =
                (this.wasdKeys.S.isDown ? 1 : 0) -
                (this.wasdKeys.W.isDown ? 1 : 0);

            if (moveX !== 0 || moveY !== 0) {
                const normalizedVector = new Phaser.Math.Vector2(
                    moveX,
                    moveY
                ).normalize();
                physicsBody.body.setVelocity(
                    normalizedVector.x * speed,
                    normalizedVector.y * speed
                );
            } else {
                physicsBody.body.setVelocity(0, 0);
            }

            // Handle rotation
            const pointer = this.scene.input.activePointer;
            const angle = Phaser.Math.Angle.Between(
                physicsBody.body.x,
                physicsBody.body.y,
                pointer.x + this.scene.cameras.main.scrollX,
                pointer.y + this.scene.cameras.main.scrollY
            );
            physicsBody.entity.setRotation(angle);
        });
    }
}

export class WeaponSystem extends System {
    constructor(scene: Scene) {
        super(scene);

        scene.input.on("pointerdown", () => this.handleShoot());
        scene.input.keyboard.on("keydown-R", () => this.handleReload());
    }

    canProcessEntity(entity: Entity): boolean {
        return (
            entity.hasComponent(WeaponComponent) &&
            entity.hasComponent(PhysicsBodyComponent)
        );
    }

    update(time: number, delta: number): void {
        this.entities.forEach((entity) => {
            const weapon = entity.getComponent(WeaponComponent);
            if (!weapon) return;

            // Only auto-fire for enemies, not the player
            if (
                this.scene.input.activePointer.isDown &&
                entity.hasComponent(PlayerControlledComponent)
            ) {
                this.tryShoot(entity, weapon, time);
            }
        });
    }

    private handleShoot(): void {
        this.entities.forEach((entity) => {
            // Only handle manual shooting for player
            if (!entity.hasComponent(PlayerControlledComponent)) return;

            const weapon = entity.getComponent(WeaponComponent);
            if (weapon) {
                if (weapon.currentAmmo === 0 && !weapon.isReloading) {
                    this.startReload(entity, weapon);
                } else {
                    this.tryShoot(entity, weapon, this.scene.time.now);
                }
            }
        });
    }

    private handleReload(): void {
        this.entities.forEach((entity) => {
            const weapon = entity.getComponent(WeaponComponent);
            if (
                weapon &&
                !weapon.isReloading &&
                weapon.currentAmmo < weapon.maxAmmo
            ) {
                this.startReload(entity, weapon);
            }
        });
    }

    private startReload(entity: Entity, weapon: WeaponComponent): void {
        weapon.isReloading = true;
        weapon.lastFired = this.scene.time.now;

        // Schedule the reload completion
        this.scene.time.delayedCall(weapon.reloadTime, () => {
            if (weapon.isReloading) {
                // Check if still reloading (might have been destroyed)
                weapon.currentAmmo = weapon.maxAmmo;
                weapon.isReloading = false;
            }
        });
    }

    private addScreenShake(): void {
        const camera = this.scene.cameras.main;
        const intensity = 5;
        const duration = 50;

        camera.shake(duration, intensity / 1000); // Intensity is in percentage (0-1)
    }

    private tryShoot(
        entity: Entity,
        weapon: WeaponComponent,
        time: number
    ): void {
        const currentWeapon = weapon.getCurrentWeapon();

        if (
            !weapon.isReloading &&
            weapon.currentAmmo > 0 &&
            time > weapon.lastFired + currentWeapon.fireRate
        ) {
            const physicsBody = entity.getComponent(PhysicsBodyComponent);
            if (!physicsBody) return;

            const pointer = this.scene.input.activePointer;
            const worldPoint = this.scene.cameras.main.getWorldPoint(
                pointer.x,
                pointer.y
            );
            const baseAngle = Phaser.Math.Angle.Between(
                physicsBody.body.x,
                physicsBody.body.y,
                worldPoint.x,
                worldPoint.y
            );

            // Get movement state for spread multiplier
            let spreadMultiplier = 1.0;
            if (entity.hasComponent(PlayerControlledComponent)) {
                const movementState = entity.getComponent(
                    MovementStateComponent
                );
                if (movementState) {
                    spreadMultiplier = movementState.getSpreadMultiplier();
                }
            }

            // Create multiple bullets for weapons like shotgun
            for (let i = 0; i < currentWeapon.bulletsPerShot; i++) {
                // Add spread to the angle, applying the movement state multiplier
                const spreadAngle =
                    baseAngle +
                    (Math.random() - 0.5) *
                        currentWeapon.spread *
                        spreadMultiplier;

                // Create bullet with weapon-specific properties
                new Bullet(
                    this.scene,
                    physicsBody.body.x,
                    physicsBody.body.y,
                    spreadAngle,
                    currentWeapon,
                    entity.hasComponent(PlayerControlledComponent)
                );
            }

            weapon.currentAmmo--;
            weapon.lastFired = time;

            // Add screen shake only for player shots
            if (entity.hasComponent(PlayerControlledComponent)) {
                this.addScreenShake();
            }

            // Auto-reload if out of ammo
            if (weapon.currentAmmo === 0) {
                this.startReload(entity, weapon);
            }
        }
    }
}

export class CollisionSystem extends System {
    private collisionGroups: Map<string, Phaser.GameObjects.GameObject[]> =
        new Map();
    private colliders: Phaser.Physics.Arcade.Collider[] = [];

    constructor(scene: Scene) {
        super(scene);
        this.setupCollisionGroups();
    }

    canProcessEntity(entity: Entity): boolean {
        return entity.hasComponent(ColliderComponent);
    }

    private setupCollisionGroups() {
        // Initialize collision groups
        this.collisionGroups.set("wall", []);
        this.collisionGroups.set("bullet", []);
        this.collisionGroups.set("player", []);
        this.collisionGroups.set("enemy", []);
    }

    update(time: number, delta: number): void {
        // Clear old colliders
        this.colliders.forEach((collider) => collider.destroy());
        this.colliders = [];

        // Clear and update collision groups
        this.setupCollisionGroups();

        // Update groups with current entities
        this.entities.forEach((entity) => {
            const collider = entity.getComponent(ColliderComponent);
            if (!collider) return;

            const group = this.collisionGroups.get(collider.group);
            if (group) {
                group.push(collider.entity);
            }
        });

        // Set up collisions between groups
        const bullets = this.collisionGroups.get("bullet") || [];
        const walls = this.collisionGroups.get("wall") || [];
        const players = this.collisionGroups.get("player") || [];
        const enemies = this.collisionGroups.get("enemy") || [];

        // Bullet-Wall collisions
        if (bullets.length > 0 && walls.length > 0) {
            walls.forEach((wall) => {
                bullets.forEach((bullet) => {
                    const collider = this.scene.physics.add.overlap(
                        bullet,
                        wall,
                        () => this.handleBulletWallCollision(bullet, wall),
                        undefined,
                        this
                    );
                    this.colliders.push(collider);
                });
            });
        }

        // Player-Wall collisions
        if (players.length > 0 && walls.length > 0) {
            const collider = this.scene.physics.add.collider(players, walls);
            this.colliders.push(collider);
        }

        // Enemy-Wall collisions
        if (enemies.length > 0 && walls.length > 0) {
            const collider = this.scene.physics.add.collider(enemies, walls);
            this.colliders.push(collider);
        }

        // Enemy-Player collisions
        if (enemies.length > 0 && players.length > 0) {
            const collider = this.scene.physics.add.collider(enemies, players);
            this.colliders.push(collider);
        }
    }

    private handleBulletWallCollision(
        bulletObj: Phaser.GameObjects.GameObject,
        wallObj: Phaser.GameObjects.GameObject
    ) {
        // Create explosion effect
        const sprite = bulletObj as Phaser.GameObjects.Sprite;
        const explosion = this.scene.add.circle(
            sprite.x,
            sprite.y,
            10,
            0xffff00,
            0.8
        );

        // Fade out and destroy explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => explosion.destroy(),
        });

        // Find and destroy the bullet entity
        this.entities.forEach((entity) => {
            if (entity.gameObject === bulletObj) {
                entity.destroy();
            }
        });
    }
}

