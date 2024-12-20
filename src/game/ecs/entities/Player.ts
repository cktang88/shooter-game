import { Scene } from "phaser";
import { Entity } from "./Entity";
import {
    PhysicsBodyComponent,
    ColliderComponent,
    HealthComponent,
    VelocityComponent,
    WeaponComponent,
    PlayerControlledComponent,
    UIComponent,
    StaminaComponent,
    MovementStateComponent,
} from "../components/Component";
import { WEAPON_TYPES } from "../components/WeaponTypes";

export class Player extends Entity {
    constructor(scene: Scene, x: number, y: number) {
        super(scene);

        // Create the player sprite
        this.gameObject = scene.add.rectangle(x, y, 48, 48, 0x00ff00);

        // Enable physics
        scene.physics.add.existing(this.gameObject);

        // Add components
        this.addComponent(new PhysicsBodyComponent(this.gameObject))
            .addComponent(
                new ColliderComponent(this.gameObject, "player", [
                    "wall",
                    "enemy",
                    "bullet",
                ])
            )
            .addComponent(new HealthComponent(this.gameObject, 100, 100))
            .addComponent(new VelocityComponent(this.gameObject, 300))
            .addComponent(
                new WeaponComponent(this.gameObject, [
                    WEAPON_TYPES.PISTOL,
                    WEAPON_TYPES.SHOTGUN,
                    WEAPON_TYPES.SMG,
                    WEAPON_TYPES.ASSAULT_RIFLE,
                    WEAPON_TYPES.MACHINE_GUN,
                ])
            )
            .addComponent(new PlayerControlledComponent(this.gameObject))
            .addComponent(new UIComponent(this.gameObject))
            .addComponent(
                new StaminaComponent(
                    this.gameObject,
                    100, // maxStamina
                    100, // currentStamina
                    50, // staminaDrain
                    10, // staminaRegen
                    0 // sprintThreshold
                )
            )
            .addComponent(new MovementStateComponent(this.gameObject));

        // Set up physics body
        const body = this.gameObject.body as Phaser.Physics.Arcade.Body;
        body.setCircle(24);
        body.setCollideWorldBounds(true);

        // Set up weapon switching controls
        scene.input.keyboard.on("keydown-Q", () => {
            const weapon = this.getComponent(WeaponComponent);
            if (weapon) {
                weapon.switchToPreviousWeapon();
            }
        });

        scene.input.keyboard.on("keydown-E", () => {
            const weapon = this.getComponent(WeaponComponent);
            if (weapon) {
                weapon.switchToNextWeapon();
            }
        });

        // Mouse wheel for weapon switching
        scene.input.on(
            "wheel",
            (
                pointer: Phaser.Input.Pointer,
                gameObjects: any,
                deltaX: number,
                deltaY: number
            ) => {
                const weapon = this.getComponent(WeaponComponent);
                if (weapon) {
                    if (deltaY > 0) {
                        weapon.switchToNextWeapon();
                    } else if (deltaY < 0) {
                        weapon.switchToPreviousWeapon();
                    }
                }
            }
        );
    }
}

