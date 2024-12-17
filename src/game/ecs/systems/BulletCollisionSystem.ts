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
    UIComponent,
    BulletRangeComponent,
} from "../components/Component";

// Import BulletSourceComponent from Bullet.ts
import { BulletSourceComponent } from "../components/Component";

export class BulletCollisionSystem extends System {
    constructor(scene: Scene) {
        super(scene);
    }

    canProcessEntity(entity: Entity): boolean {
        return entity.hasComponent(ColliderComponent);
    }

    update(time: number, delta: number): void {
        const bullets = Array.from(this.entities).filter((entity) =>
            entity.hasComponent(BulletSourceComponent)
        );
        const enemies = Array.from(this.entities).filter((entity) =>
            entity.hasComponent(EnemyComponent)
        );
        const players = Array.from(this.entities).filter((entity) =>
            entity.hasComponent(PlayerControlledComponent)
        );

        // Handle bullet collisions with enemies
        bullets.forEach((bullet) => {
            const bulletSource = bullet.getComponent(BulletSourceComponent);
            const isPlayerBullet = bulletSource && bulletSource.isPlayerBullet;

            enemies.forEach((enemy) => {
                // Only player bullets can damage enemies
                if (isPlayerBullet) {
                    this.scene.physics.add.overlap(
                        bullet.gameObject,
                        enemy.gameObject,
                        () => this.handleBulletHit(bullet, enemy),
                        undefined,
                        this
                    );
                }
            });
        });

        // Handle bullet collisions with player
        bullets.forEach((bullet) => {
            const bulletSource = bullet.getComponent(BulletSourceComponent);
            const isEnemyBullet = bulletSource && !bulletSource.isPlayerBullet;

            players.forEach((player) => {
                // Only enemy bullets can damage player
                if (isEnemyBullet) {
                    this.scene.physics.add.overlap(
                        bullet.gameObject,
                        player.gameObject,
                        () => this.handleBulletHit(bullet, player),
                        undefined,
                        this
                    );
                }
            });
        });
    }

    private createExplosion(x: number, y: number): void {
        // Create explosion effect
        const explosion = this.scene.add.circle(x, y, 10, 0xffff00, 0.8);

        // Fade out and destroy explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => explosion.destroy(),
        });
    }

    private calculateDamageWithFalloff(
        bulletEntity: Entity,
        damageComponent: DamageComponent
    ): number {
        const rangeComponent = bulletEntity.getComponent(BulletRangeComponent);
        if (!rangeComponent) return damageComponent.damage;

        const bulletObj =
            bulletEntity.gameObject as Phaser.GameObjects.GameObject;
        const distance = Phaser.Math.Distance.Between(
            rangeComponent.startX,
            rangeComponent.startY,
            bulletObj.x,
            bulletObj.y
        );

        const { range, falloffStart, bulletDamage, minDamage } =
            rangeComponent.weaponConfig;

        // If within falloffStart distance, do full damage
        if (distance <= falloffStart) {
            return bulletDamage;
        }

        // If beyond maximum range, do minimum damage
        if (distance >= range) {
            return minDamage;
        }

        // Linear interpolation between falloffStart and range
        const falloffRange = range - falloffStart;
        const distanceInFalloff = distance - falloffStart;
        const falloffPercent = distanceInFalloff / falloffRange;

        return bulletDamage - (bulletDamage - minDamage) * falloffPercent;
    }

    private handleBulletHit(bulletEntity: Entity, targetEntity: Entity) {
        if (!bulletEntity || !targetEntity) return;

        // Get damage amount from bullet
        const damageComponent = bulletEntity.getComponent(DamageComponent);
        const targetHealth = targetEntity.getComponent(HealthComponent);

        if (damageComponent && targetHealth) {
            // Calculate damage with falloff
            const finalDamage = this.calculateDamageWithFalloff(
                bulletEntity,
                damageComponent
            );
            targetHealth.health -= finalDamage;
            console.log(
                `Hit! Damage: ${finalDamage.toFixed(1)}, Health remaining: ${
                    targetHealth.health
                }`
            );

            // Create explosion at bullet position
            const bulletObj =
                bulletEntity.gameObject as Phaser.GameObjects.GameObject;
            this.createExplosion(bulletObj.x, bulletObj.y);

            // Handle death
            if (targetHealth.health <= 0) {
                if (targetEntity.hasComponent(EnemyComponent)) {
                    console.log("Enemy destroyed!");
                    // Remove enemy from all systems before destroying
                    this.scene.events.emit("enemy-destroyed", targetEntity);
                    // Ensure UI components are destroyed first
                    const uiComponent = targetEntity.getComponent(UIComponent);
                    if (uiComponent) {
                        uiComponent.destroy();
                    }
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
}

