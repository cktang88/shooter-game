import { Scene } from "phaser";
import { System } from "./System";
import { Entity } from "../entities/Entity";
import { Bullet } from "../entities/Bullet";
import {
    PhysicsBodyComponent,
    WeaponComponent,
    HealthComponent,
    EnemyComponent,
} from "../components/Component";
import { ENEMY_WEAPON } from "../components/WeaponTypes";

export class EnemySystem extends System {
    private player: Entity | null = null;
    private readonly SIGHT_RANGE = 1200;
    private readonly MOVEMENT_SPEED = 150;
    private readonly AIM_RANDOMNESS = 100; // Pixels of random deviation

    constructor(scene: Scene) {
        super(scene);
    }

    setPlayer(player: Entity) {
        this.player = player;
    }

    canProcessEntity(entity: Entity): boolean {
        return entity.hasComponent(EnemyComponent);
    }

    private predictPlayerPosition(
        playerPos: Phaser.Math.Vector2,
        playerVelocity: Phaser.Math.Vector2,
        bulletStartPos: Phaser.Math.Vector2
    ): Phaser.Math.Vector2 {
        // Calculate distance to player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            bulletStartPos.x,
            bulletStartPos.y,
            playerPos.x,
            playerPos.y
        );

        // Calculate time bullet will take to reach the player
        const bulletTravelTime = distanceToPlayer / ENEMY_WEAPON.speed;

        // Predict where player will be
        const predictedX = playerPos.x + playerVelocity.x * bulletTravelTime;
        const predictedY = playerPos.y + playerVelocity.y * bulletTravelTime;

        // Add randomness
        const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const randomDistance = Phaser.Math.FloatBetween(0, this.AIM_RANDOMNESS);
        const randomX = Math.cos(randomAngle) * randomDistance;
        const randomY = Math.sin(randomAngle) * randomDistance;

        return new Phaser.Math.Vector2(
            predictedX + randomX,
            predictedY + randomY
        );
    }

    update(time: number, delta: number): void {
        if (!this.player) return;

        const playerPhysics = this.player.getComponent(PhysicsBodyComponent);
        if (!playerPhysics) return;

        const playerPos = new Phaser.Math.Vector2(
            playerPhysics.body.x,
            playerPhysics.body.y
        );
        const playerVelocity = new Phaser.Math.Vector2(
            playerPhysics.body.velocity.x,
            playerPhysics.body.velocity.y
        );

        this.entities.forEach((enemy) => {
            const enemyPhysics = enemy.getComponent(PhysicsBodyComponent);
            const enemyWeapon = enemy.getComponent(WeaponComponent);
            const enemyHealth = enemy.getComponent(HealthComponent);

            if (!enemyPhysics || !enemyWeapon || !enemyHealth) return;

            const enemyPos = new Phaser.Math.Vector2(
                enemyPhysics.body.x,
                enemyPhysics.body.y
            );

            // Calculate distance to player
            const distance = enemyPos.distance(playerPos);

            // If player is within sight range
            if (distance < this.SIGHT_RANGE) {
                // Predict where to aim
                const predictedPos = this.predictPlayerPosition(
                    playerPos,
                    playerVelocity,
                    enemyPos
                );

                // Calculate angle to predicted position
                const angle = Phaser.Math.Angle.Between(
                    enemyPos.x,
                    enemyPos.y,
                    predictedPos.x,
                    predictedPos.y
                );

                // Rotate enemy to face predicted position
                enemy.gameObject.setRotation(angle);

                // Move towards player's current position (not predicted)
                const velocity = this.scene.physics.velocityFromAngle(
                    Phaser.Math.RadToDeg(
                        Phaser.Math.Angle.Between(
                            enemyPos.x,
                            enemyPos.y,
                            playerPos.x,
                            playerPos.y
                        )
                    ),
                    this.MOVEMENT_SPEED
                );
                enemyPhysics.body.setVelocity(velocity.x, velocity.y);

                // Try to shoot at predicted position
                if (time > enemyWeapon.lastFired + ENEMY_WEAPON.fireRate) {
                    new Bullet(
                        this.scene,
                        enemyPos.x,
                        enemyPos.y,
                        angle,
                        ENEMY_WEAPON,
                        false
                    );
                    enemyWeapon.lastFired = time;
                }
            } else {
                // Stop moving if player is out of range
                enemyPhysics.body.setVelocity(0, 0);
            }
        });
    }
}

