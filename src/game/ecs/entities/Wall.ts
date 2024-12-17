import { Scene } from "phaser";
import { Entity } from "./Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
} from "../components/Component";

export class Wall extends Entity {
    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        super(scene);

        // Create the wall rectangle
        this.gameObject = scene.add.rectangle(x, y, width, height, 0x808080);

        // Enable physics
        scene.physics.add.existing(this.gameObject, true); // true = static body

        // Add components
        this.addComponent(
            new PhysicsBodyComponent(this.gameObject)
        ).addComponent(
            new ColliderComponent(this.gameObject, "wall", ["player", "bullet"])
        );
    }
}
