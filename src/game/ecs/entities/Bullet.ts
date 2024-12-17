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

        // Create the bullet line
        const bulletLength = 20;
        this.gameObject = scene.add.line(
            x,
            y,
            0,
            0,
            Math.cos(angle) * bulletLength,
            Math.sin(angle) * bulletLength,
            0xffff00
        );
        (this.gameObject as Phaser.GameObjects.Line).setLineWidth(2);

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
