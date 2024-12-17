import { Component } from "../components/Component";
import { Scene } from "phaser";

export abstract class Entity {
    protected components: Map<string, Component> = new Map();
    public gameObject: Phaser.GameObjects.GameObject;

    constructor(protected scene: Scene) {}

    addComponent(component: Component): this {
        this.components.set(component.constructor.name, component);
        return this;
    }

    getComponent<T extends Component>(
        componentClass: new (...args: any[]) => T
    ): T | undefined {
        return this.components.get(componentClass.name) as T;
    }

    hasComponent(componentClass: new (...args: any[]) => Component): boolean {
        return this.components.has(componentClass.name);
    }

    removeComponent(
        componentClass: new (...args: any[]) => Component
    ): boolean {
        return this.components.delete(componentClass.name);
    }

    destroy(): void {
        this.components.clear();
        if (this.gameObject) {
            this.gameObject.destroy();
        }
    }
}
