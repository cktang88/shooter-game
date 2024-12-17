import { Scene } from "phaser";
import { System } from "./System";
import { Entity } from "../entities/Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
    DamageComponent,
    HealthComponent,
    EnemyComponent,
    PlayerControlledComponent,
} from "../components/Component";

// Import BulletSourceComponent from Bullet.ts
import { BulletSourceComponent } from "../components/Component";

export class BulletCollisionSystem extends System {
    private collisionGroups: Map<string, Phaser.GameObjects.GameObject[]> =
        new Map();

    constructor(scene: Scene) {
        super(scene);
        this.setupCollisionGroups();
    }

    private setupCollisionGroups() {
        this.collisionGroups.clear();
        this.collisionGroups.set("bullet", []);
        this.collisionGroups.set("enemy", []);
        this.collisionGroups.set("wall", []);
        this.collisionGroups.set("player", []);
    }

    canProcessEntity(entity: Entity): boolean {
        return (
            entity.hasComponent(ColliderComponent) &&
            entity.hasComponent(PhysicsBodyComponent)
        );
    }

    update(time: number, delta: number): void {
        // Reset collision groups
        this.setupCollisionGroups();

        // Sort entities into collision groups
        this.entities.forEach((entity) => {
            const collider = entity.getComponent(ColliderComponent);
            if (!collider) return;

            const group = this.collisionGroups.get(collider.group);
            if (group) {
                group.push(entity.gameObject);
            }
        });

        const bullets = this.collisionGroups.get("bullet") || [];
        const enemies = this.collisionGroups.get("enemy") || [];
        const walls = this.collisionGroups.get("wall") || [];
        const players = this.collisionGroups.get("player") || [];

        // Handle bullet collisions with walls
        bullets.forEach((bullet) => {
            walls.forEach((wall) => {
                this.scene.physics.add.overlap(
                    bullet,
                    wall,
                    () => this.handleBulletCollision(bullet),
                    undefined,
                    this
                );
            });
        });

        // Handle bullet collisions with enemies
        bullets.forEach((bullet) => {
            const bulletEntity = this.findEntityByGameObject(bullet);
            const bulletSource = bulletEntity?.getComponent(
                BulletSourceComponent
            );
            const isPlayerBullet = bulletSource?.isPlayerBullet;

            enemies.forEach((enemy) => {
                // Only player bullets can damage enemies
                if (isPlayerBullet) {
                    this.scene.physics.add.overlap(
                        bullet,
                        enemy,
                        () => this.handleBulletHit(bullet, enemy),
                        undefined,
                        this
                    );
                }
            });
        });

        // Handle bullet collisions with player
        bullets.forEach((bullet) => {
            const bulletEntity = this.findEntityByGameObject(bullet);
            const bulletSource = bulletEntity?.getComponent(
                BulletSourceComponent
            );
            const isEnemyBullet = bulletSource && !bulletSource.isPlayerBullet;

            players.forEach((player) => {
                // Only enemy bullets can damage player
                if (isEnemyBullet) {
                    this.scene.physics.add.overlap(
                        bullet,
                        player,
                        () => this.handleBulletHit(bullet, player),
                        undefined,
                        this
                    );
                }
            });
        });
    }

    private handleBulletCollision(bulletObj: Phaser.GameObjects.GameObject) {
        const bulletEntity = this.findEntityByGameObject(bulletObj);
        if (bulletEntity) {
            bulletEntity.destroy();
        }
    }

    private handleBulletHit(
        bulletObj: Phaser.GameObjects.GameObject,
        targetObj: Phaser.GameObjects.GameObject
    ) {
        const bulletEntity = this.findEntityByGameObject(bulletObj);
        const targetEntity = this.findEntityByGameObject(targetObj);

        if (!bulletEntity || !targetEntity) return;

        // Get damage amount from bullet
        const damageComponent = bulletEntity.getComponent(DamageComponent);
        const targetHealth = targetEntity.getComponent(HealthComponent);

        if (damageComponent && targetHealth) {
            targetHealth.health -= damageComponent.damage;
            console.log(`Hit! Health remaining: ${targetHealth.health}`);

            // Handle death
            if (targetHealth.health <= 0) {
                if (targetEntity.hasComponent(EnemyComponent)) {
                    console.log("Enemy destroyed!");
                    targetEntity.destroy();
                } else if (
                    targetEntity.hasComponent(PlayerControlledComponent)
                ) {
                    console.log("Player died!");
                    // Handle player death (you might want to trigger game over)
                }
            }
        }

        // Destroy bullet after hit
        bulletEntity.destroy();
    }

    private findEntityByGameObject(
        gameObject: Phaser.GameObjects.GameObject
    ): Entity | undefined {
        return Array.from(this.entities).find(
            (entity) => entity.gameObject === gameObject
        );
    }
}

