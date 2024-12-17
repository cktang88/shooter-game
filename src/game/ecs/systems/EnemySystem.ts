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

export class EnemySystem extends System {
    private player: Entity | null = null;
    private readonly SIGHT_RANGE = 1200;
    private readonly MOVEMENT_SPEED = 150;

    constructor(scene: Scene) {
        super(scene);
    }

    setPlayer(player: Entity) {
        this.player = player;
    }

    canProcessEntity(entity: Entity): boolean {
        return entity.hasComponent(EnemyComponent);
    }

    update(time: number, delta: number): void {
        if (!this.player) return;

        const playerPhysics = this.player.getComponent(PhysicsBodyComponent);
        if (!playerPhysics) return;

        this.entities.forEach((enemy) => {
            const enemyPhysics = enemy.getComponent(PhysicsBodyComponent);
            const enemyWeapon = enemy.getComponent(WeaponComponent);
            const enemyHealth = enemy.getComponent(HealthComponent);

            if (!enemyPhysics || !enemyWeapon || !enemyHealth) return;

            // Calculate distance to player
            const distance = Phaser.Math.Distance.Between(
                enemyPhysics.body.x,
                enemyPhysics.body.y,
                playerPhysics.body.x,
                playerPhysics.body.y
            );

            // If player is within sight range
            if (distance < this.SIGHT_RANGE) {
                // Calculate angle to player
                const angle = Phaser.Math.Angle.Between(
                    enemyPhysics.body.x,
                    enemyPhysics.body.y,
                    playerPhysics.body.x,
                    playerPhysics.body.y
                );

                // Rotate enemy to face player
                enemy.gameObject.setRotation(angle);

                // Move towards player
                const velocity = this.scene.physics.velocityFromAngle(
                    Phaser.Math.RadToDeg(angle),
                    this.MOVEMENT_SPEED
                );
                enemyPhysics.body.setVelocity(velocity.x, velocity.y);

                // Try to shoot at player
                if (time > enemyWeapon.lastFired + enemyWeapon.fireRate) {
                    // Create bullet
                    new Bullet(
                        this.scene,
                        enemyPhysics.body.x,
                        enemyPhysics.body.y,
                        angle,
                        2000,
                        10,
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

