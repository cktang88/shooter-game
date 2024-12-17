import { Scene } from "phaser";
import { Entity } from "./Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
    DamageComponent,
    BulletSourceComponent,
    BulletRangeComponent,
} from "../components/Component";
import { WeaponConfig } from "../components/WeaponTypes";

export class Bullet extends Entity {
    constructor(
        scene: Scene,
        x: number,
        y: number,
        angle: number,
        weaponConfig: WeaponConfig,
        isPlayerBullet: boolean = false
    ) {
        super(scene);

        // Create the bullet sprite with the specified color
        this.gameObject = scene.add
            .rectangle(x, y, 60, 4, weaponConfig.bulletColor)
            .setAlpha(1);

        // Enable physics
        scene.physics.add.existing(this.gameObject);

        // Add components
        this.addComponent(new PhysicsBodyComponent(this.gameObject))
            .addComponent(
                new ColliderComponent(this.gameObject, "bullet", [
                    "wall",
                    "enemy",
                    "player",
                ])
            )
            .addComponent(
                new DamageComponent(this.gameObject, weaponConfig.bulletDamage)
            )
            .addComponent(
                new BulletSourceComponent(this.gameObject, isPlayerBullet)
            )
            .addComponent(
                new BulletRangeComponent(this.gameObject, x, y, weaponConfig)
            );

        // Set up physics body
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;

        // Configure physics body
        body.setCircle(4); // Half of the rectangle size for circular collision
        body.setAllowGravity(false);
        body.setFriction(0, 0);
        body.setBounce(0);

        // Set rotation to match angle
        this.gameObject.setRotation(angle);

        // Set velocity based on angle
        const velocity = scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle),
            weaponConfig.bulletSpeed
        );
        body.setVelocity(velocity.x, velocity.y);

        // Emit bullet created event
        scene.events.emit("bullet-created", this);

        // Destroy bullet after maximum range time
        const maxRangeTime =
            (weaponConfig.range / weaponConfig.bulletSpeed) * 1000;
        scene.time.delayedCall(maxRangeTime, () => {
            this.destroy();
        });
    }

    onCollide(other: Entity): void {
        this.destroy();
    }
}

export { BulletSourceComponent };

