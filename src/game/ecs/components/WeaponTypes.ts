export interface WeaponConfig {
    name: string;
    fireRate: number; // Time between shots in ms
    clipSize: number; // Bullets per clip
    reloadTime: number; // Time to reload in ms
    bulletSpeed: number; // Speed of bullets
    bulletDamage: number; // Damage per bullet
    bulletColor: number; // Bullet color in hex
    spread: number; // Bullet spread in radians
    bulletsPerShot: number; // Number of bullets per shot (for shotgun)
    range: number; // Effective range in pixels
    falloffStart: number; // Distance at which damage starts to decrease
    minDamage: number; // Minimum damage at maximum range
}

export const WEAPON_TYPES: { [key: string]: WeaponConfig } = {
    PISTOL: {
        name: "Pistol",
        fireRate: 250,
        clipSize: 12,
        reloadTime: 1000,
        bulletSpeed: 1500,
        bulletDamage: 25,
        bulletColor: 0xffff00, // Yellow
        spread: 0.05,
        bulletsPerShot: 1,
        range: 800,
        falloffStart: 600,
        minDamage: 15,
    },
    SHOTGUN: {
        name: "Shotgun",
        fireRate: 800,
        clipSize: 6,
        reloadTime: 2500,
        bulletSpeed: 1800,
        bulletDamage: 15,
        bulletColor: 0xff0000, // Red
        spread: 0.3,
        bulletsPerShot: 8,
        range: 600,
        falloffStart: 400,
        minDamage: 8,
    },
    SMG: {
        name: "SMG",
        fireRate: 80,
        clipSize: 30,
        reloadTime: 1400,
        bulletSpeed: 2000,
        bulletDamage: 16,
        bulletColor: 0x00ff00, // Green
        spread: 0.1,
        bulletsPerShot: 1,
        range: 600,
        falloffStart: 400,
        minDamage: 12,
    },
    ASSAULT_RIFLE: {
        name: "Assault Rifle",
        fireRate: 120,
        clipSize: 25,
        reloadTime: 2200,
        bulletSpeed: 2200,
        bulletDamage: 20,
        bulletColor: 0x00ffff, // Blue
        spread: 0.08,
        bulletsPerShot: 1,
        range: 1000,
        falloffStart: 500,
        minDamage: 10,
    },
    MACHINE_GUN: {
        name: "Machine Gun",
        fireRate: 100,
        clipSize: 75,
        reloadTime: 3500,
        bulletSpeed: 1800,
        bulletDamage: 16,
        bulletColor: 0xff00ff, // Purple
        spread: 0.15,
        bulletsPerShot: 1,
        range: 850,
        falloffStart: 450,
        minDamage: 8,
    },
};

// Enemy weapon config
export const ENEMY_WEAPON: WeaponConfig = {
    name: "Enemy Gun",
    fireRate: 1000,
    clipSize: Infinity,
    reloadTime: 0,
    bulletSpeed: 1500,
    bulletDamage: 10,
    bulletColor: 0xff6600, // Orange
    spread: 0.1,
    bulletsPerShot: 1,
    range: 700,
    falloffStart: 350,
    minDamage: 5,
};

