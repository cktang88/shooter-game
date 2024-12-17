import { Scene } from "phaser";
import { Entity } from "./Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
    DamageComponent,
} from "../components/Component";

export class Bullet extends Entity {
    constructor(
        scene: Scene,
        x: number,
        y: number,
        angle: number,
        speed: number = 2000,
        damage: number = 10
    ) {
        super(scene);

        // Create the bullet sprite instead of line for better physics
        this.gameObject = scene.add.rectangle(x, y, 20, 4, 0xffff00);

        // Enable physics
        scene.physics.add.existing(this.gameObject);

        // Add components
        this.addComponent(new PhysicsBodyComponent(this.gameObject))
            .addComponent(
                new ColliderComponent(this.gameObject, "bullet", [
                    "wall",
                    "enemy",
                ])
            )
            .addComponent(new DamageComponent(this.gameObject, damage));

        // Set up physics body
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;

        // Configure physics body
        body.setAllowGravity(false);
        body.setFriction(0, 0);
        body.setBounce(0);

        // Set rotation to match angle
        this.gameObject.setRotation(angle);

        // Set velocity based on angle
        const velocity = scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle),
            speed
        );
        body.setVelocity(velocity.x, velocity.y);

        // Destroy bullet after 1 second
        scene.time.delayedCall(1000, () => {
            this.destroy();
        });
    }

    onCollide(other: Entity): void {
        this.destroy();
    }
}

