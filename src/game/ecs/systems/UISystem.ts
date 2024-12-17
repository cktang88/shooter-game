import { Scene } from "phaser";
import { System } from "./System";
import { Entity } from "../entities/Entity";
import {
    UIComponent,
    HealthComponent,
    WeaponComponent,
    PhysicsBodyComponent,
} from "../components/Component";

export class UISystem extends System {
    constructor(scene: Scene) {
        super(scene);
    }

    canProcessEntity(entity: Entity): boolean {
        return (
            entity.hasComponent(UIComponent) &&
            entity.hasComponent(HealthComponent) &&
            entity.hasComponent(PhysicsBodyComponent)
        );
    }

    update(time: number, delta: number): void {
        this.entities.forEach((entity) => {
            const ui = entity.getComponent(UIComponent);
            const health = entity.getComponent(HealthComponent);
            const weapon = entity.getComponent(WeaponComponent);
            const physics = entity.getComponent(PhysicsBodyComponent);

            if (!ui || !health || !physics) return;

            // Update position of UI elements to follow entity
            ui.updatePosition(physics.body.x, physics.body.y);

            // Update health bar
            ui.updateHealthBar(health.health, health.maxHealth);

            // Update reload bar if weapon exists and is reloading
            if (weapon && weapon.isReloading) {
                const reloadProgress = Math.min(
                    (time - weapon.lastFired) / weapon.reloadTime,
                    1
                );
                ui.updateReloadBar(reloadProgress);
            } else {
                ui.updateReloadBar(0);
            }
        });
    }
}
