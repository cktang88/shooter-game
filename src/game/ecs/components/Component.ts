import { WeaponConfig, WEAPON_TYPES } from "./WeaponTypes";

export abstract class Component {
    constructor(public readonly entity: Phaser.GameObjects.GameObject) {}
}

// Physics-related components
export class PhysicsBodyComponent extends Component {
    body: Phaser.Physics.Arcade.Body;

    constructor(entity: Phaser.GameObjects.GameObject) {
        super(entity);
        this.body = entity.body as Phaser.Physics.Arcade.Body;
    }
}

export class ColliderComponent extends Component {
    constructor(
        entity: Phaser.GameObjects.GameObject,
        public readonly group: string,
        public readonly collidesWith: string[]
    ) {
        super(entity);
    }
}

// Health and damage components
export class HealthComponent extends Component {
    constructor(
        entity: Phaser.GameObjects.GameObject,
        public health: number,
        public maxHealth: number
    ) {
        super(entity);
    }
}

export class DamageComponent extends Component {
    constructor(entity: Phaser.GameObjects.GameObject, public damage: number) {
        super(entity);
    }
}

// Movement components
export class VelocityComponent extends Component {
    constructor(entity: Phaser.GameObjects.GameObject, public speed: number) {
        super(entity);
    }
}

// Weapon components
export class WeaponComponent extends Component {
    public currentWeaponIndex: number = 0;
    public weapons: WeaponConfig[] = [];
    public currentAmmo: number;
    public isReloading: boolean = false;
    public lastFired: number = 0;

    constructor(
        entity: Phaser.GameObjects.GameObject,
        weaponConfigs: WeaponConfig[] = [WEAPON_TYPES.PISTOL]
    ) {
        super(entity);
        this.weapons = weaponConfigs;
        this.currentAmmo = this.getCurrentWeapon().clipSize;
    }

    getCurrentWeapon(): WeaponConfig {
        return this.weapons[this.currentWeaponIndex];
    }

    switchToNextWeapon(): void {
        if (this.isReloading) return; // Don't switch while reloading
        this.currentWeaponIndex =
            (this.currentWeaponIndex + 1) % this.weapons.length;
        this.currentAmmo = this.getCurrentWeapon().clipSize;
    }

    switchToPreviousWeapon(): void {
        if (this.isReloading) return; // Don't switch while reloading
        this.currentWeaponIndex =
            (this.currentWeaponIndex - 1 + this.weapons.length) %
            this.weapons.length;
        this.currentAmmo = this.getCurrentWeapon().clipSize;
    }

    get fireRate(): number {
        return this.getCurrentWeapon().fireRate;
    }

    get maxAmmo(): number {
        return this.getCurrentWeapon().clipSize;
    }

    get reloadTime(): number {
        return this.getCurrentWeapon().reloadTime;
    }
}

// Input components
export class PlayerControlledComponent extends Component {
    constructor(entity: Phaser.GameObjects.GameObject) {
        super(entity);
    }
}

// Entity type components
export class EnemyComponent extends Component {
    constructor(entity: Phaser.GameObjects.GameObject) {
        super(entity);
    }
}

// Component to identify bullet source
export class BulletSourceComponent extends Component {
    constructor(
        entity: Phaser.GameObjects.GameObject,
        public isPlayerBullet: boolean
    ) {
        super(entity);
    }
}

// UI components
export class UIComponent extends Component {
    healthBar: Phaser.GameObjects.Graphics;
    reloadBar: Phaser.GameObjects.Graphics;

    constructor(entity: Phaser.GameObjects.GameObject) {
        super(entity);
        const scene = entity.scene;

        // Create health bar
        this.healthBar = scene.add.graphics();

        // Create reload bar (initially hidden)
        this.reloadBar = scene.add.graphics();
        this.reloadBar.visible = false;
    }

    updateHealthBar(health: number, maxHealth: number): void {
        this.healthBar.clear();

        // Draw background
        this.healthBar.fillStyle(0x000000, 0.8);
        this.healthBar.fillRect(-25, -40, 50, 8);

        // Draw health
        const healthPercentage = Math.max(0, health) / maxHealth;
        this.healthBar.fillStyle(0x00ff00, 1);
        this.healthBar.fillRect(-25, -40, 50 * healthPercentage, 8);
    }

    updateReloadBar(progress: number): void {
        this.reloadBar.clear();

        if (progress > 0) {
            this.reloadBar.visible = true;

            // Draw background
            this.reloadBar.fillStyle(0x000000, 0.8);
            this.reloadBar.fillRect(-25, -30, 50, 6);

            // Draw progress
            this.reloadBar.fillStyle(0xffff00, 1);
            this.reloadBar.fillRect(-25, -30, 50 * progress, 6);
        } else {
            this.reloadBar.visible = false;
        }
    }

    updatePosition(x: number, y: number): void {
        this.healthBar.setPosition(x, y);
        this.reloadBar.setPosition(x, y);
    }

    destroy(): void {
        this.healthBar.destroy();
        this.reloadBar.destroy();
    }
}

