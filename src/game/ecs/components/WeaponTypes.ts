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
}

export const WEAPON_TYPES: { [key: string]: WeaponConfig } = {
    PISTOL: {
        name: "Pistol",
        fireRate: 250,
        clipSize: 12,
        reloadTime: 1000,
        bulletSpeed: 2000,
        bulletDamage: 25,
        bulletColor: 0xffff00, // Yellow
        spread: 0.05,
        bulletsPerShot: 1,
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
    },
    SMG: {
        name: "SMG",
        fireRate: 80,
        clipSize: 30,
        reloadTime: 1500,
        bulletSpeed: 1900,
        bulletDamage: 15,
        bulletColor: 0x00ff00, // Green
        spread: 0.1,
        bulletsPerShot: 1,
    },
    ASSAULT_RIFLE: {
        name: "Assault Rifle",
        fireRate: 120,
        clipSize: 25,
        reloadTime: 2000,
        bulletSpeed: 2200,
        bulletDamage: 20,
        bulletColor: 0x0000ff, // Blue
        spread: 0.08,
        bulletsPerShot: 1,
    },
    MACHINE_GUN: {
        name: "Machine Gun",
        fireRate: 100,
        clipSize: 50,
        reloadTime: 3000,
        bulletSpeed: 2000,
        bulletDamage: 18,
        bulletColor: 0xff00ff, // Purple
        spread: 0.15,
        bulletsPerShot: 1,
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
};
