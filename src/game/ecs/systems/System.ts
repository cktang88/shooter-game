import { Scene } from "phaser";
import { Entity } from "../entities/Entity";
import { Bullet } from "../entities/Bullet";
import {
    Component,
    PlayerControlledComponent,
    WeaponComponent,
    PhysicsBodyComponent,
    ColliderComponent,
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

    constructor(scene: Scene) {
        super(scene);
        this.wasdKeys = scene.input.keyboard.addKeys("W,A,S,D,R") as any;
    }

    canProcessEntity(entity: Entity): boolean {
        return (
            entity.hasComponent(PlayerControlledComponent) &&
            entity.hasComponent(PhysicsBodyComponent)
        );
    }

    update(time: number, delta: number): void {
        this.entities.forEach((entity) => {
            const physicsBody = entity.getComponent(PhysicsBodyComponent);
            if (!physicsBody) return;

            const speed = 300;
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
                this.tryShoot(entity, weapon, this.scene.time.now);
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

    private tryShoot(
        entity: Entity,
        weapon: WeaponComponent,
        time: number
    ): void {
        if (
            !weapon.isReloading &&
            weapon.currentAmmo > 0 &&
            time > weapon.lastFired + weapon.fireRate
        ) {
            const physicsBody = entity.getComponent(PhysicsBodyComponent);
            if (!physicsBody) return;

            const pointer = this.scene.input.activePointer;
            const angle = Phaser.Math.Angle.Between(
                physicsBody.body.x,
                physicsBody.body.y,
                pointer.x + this.scene.cameras.main.scrollX,
                pointer.y + this.scene.cameras.main.scrollY
            );

            // Create bullet
            new Bullet(
                this.scene,
                physicsBody.body.x,
                physicsBody.body.y,
                angle
            );

            weapon.currentAmmo--;
            weapon.lastFired = time;
        }
    }

    private startReload(entity: Entity, weapon: WeaponComponent): void {
        weapon.isReloading = true;

        this.scene.time.delayedCall(weapon.reloadTime, () => {
            weapon.currentAmmo = weapon.maxAmmo;
            weapon.isReloading = false;
        });
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
    }

    private handleBulletWallCollision(
        bulletObj: Phaser.GameObjects.GameObject,
        wallObj: Phaser.GameObjects.GameObject
    ) {
        console.log(
            "Bullet-Wall collision detected, positions: ",
            bulletObj.x,
            bulletObj.y,
            wallObj.x,
            wallObj.y
        );
        // Find and destroy the bullet entity
        this.entities.forEach((entity) => {
            if (entity.gameObject === bulletObj) {
                entity.destroy();
            }
        });
    }
}

