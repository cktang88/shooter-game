import { Scene } from "phaser";
import { Entity } from "./Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
    HealthComponent,
    WeaponComponent,
    EnemyComponent,
    UIComponent,
} from "../components/Component";

export class Enemy extends Entity {
    constructor(scene: Scene, x: number, y: number) {
        super(scene);

        // Create a texture for the enemy (red circle)
        const textureKey = "enemy-circle";

        // Only create the texture once
        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.add.graphics();

            // Move to center of graphics context
            graphics.translateCanvas(16, 16);

            // Draw circle
            graphics.lineStyle(2, 0xffffff);
            graphics.fillStyle(0xff0000);
            graphics.beginPath();
            graphics.arc(0, 0, 12, 0, Math.PI * 2); // Circle centered at (0,0) with radius 12
            graphics.closePath();
            graphics.fill();
            graphics.stroke();

            // Generate texture from graphics
            graphics.generateTexture(textureKey, 32, 32);
            graphics.destroy();
        }

        // Create sprite using the generated texture
        this.gameObject = scene.add.sprite(x, y, textureKey);
        this.gameObject.setScale(2); // Make enemy twice as large

        // Enable physics
        scene.physics.add.existing(this.gameObject);

        // Add components
        this.addComponent(new EnemyComponent(this.gameObject))
            .addComponent(new PhysicsBodyComponent(this.gameObject))
            .addComponent(
                new ColliderComponent(this.gameObject, "enemy", [
                    "wall",
                    "bullet",
                    "player",
                ])
            )
            .addComponent(new HealthComponent(this.gameObject, 100, 100))
            .addComponent(
                new WeaponComponent(
                    this.gameObject,
                    1000, // slower fire rate than player
                    0,
                    Infinity, // infinite ammo
                    Infinity,
                    0, // no reload needed
                    false
                )
            )
            .addComponent(new UIComponent(this.gameObject));

        // Set up physics body
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setCircle(24); // Doubled from 12 to match new scale
        body.setBounce(1, 1);
        body.setCollideWorldBounds(true);
    }
}

