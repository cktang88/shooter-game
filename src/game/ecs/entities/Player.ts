import { Scene } from "phaser";
import { Entity } from "./Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
    HealthComponent,
    VelocityComponent,
    WeaponComponent,
    PlayerControlledComponent,
} from "../components/Component";

export class Player extends Entity {
    constructor(scene: Scene, x: number, y: number) {
        super(scene);

        // Create the player sprite
        this.gameObject = scene.physics.add.sprite(x, y, "player");

        // Add components
        this.addComponent(new PhysicsBodyComponent(this.gameObject))
            .addComponent(
                new ColliderComponent(this.gameObject, "player", [
                    "wall",
                    "enemy",
                ])
            )
            .addComponent(new HealthComponent(this.gameObject, 100, 100))
            .addComponent(new VelocityComponent(this.gameObject, 300))
            .addComponent(
                new WeaponComponent(
                    this.gameObject,
                    100, // fireRate
                    0, // lastFired
                    30, // currentAmmo
                    30, // maxAmmo
                    2000, // reloadTime
                    false // isReloading
                )
            )
            .addComponent(new PlayerControlledComponent(this.gameObject));

        // Set up physics body
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setCircle(12);
        body.setCollideWorldBounds(true);
    }
}

