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
    constructor(
        entity: Phaser.GameObjects.GameObject,
        public fireRate: number,
        public lastFired: number = 0,
        public currentAmmo: number,
        public maxAmmo: number,
        public reloadTime: number,
        public isReloading: boolean = false
    ) {
        super(entity);
    }
}

// Input components
export class PlayerControlledComponent extends Component {
    constructor(entity: Phaser.GameObjects.GameObject) {
        super(entity);
    }
}
