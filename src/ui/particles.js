export function spawnRewardBurst(scene, x, y, count = 16) {
  if (!scene) {
    return;
  }

  for (let i = 0; i < count; i += 1) {
    const radius = Phaser.Math.Between(3, 7);
    const color = i % 3 === 0 ? 0xffffff : 0xffd54f;
    const particle = scene.add
      .circle(x + Phaser.Math.Between(-30, 30), y + Phaser.Math.Between(-14, 14), radius, color, 1)
      .setDepth(250);

    scene.tweens.add({
      targets: particle,
      x: x + Phaser.Math.Between(-150, 150),
      y: y - Phaser.Math.Between(50, 170),
      alpha: 0,
      scale: 0.2,
      duration: Phaser.Math.Between(650, 1150),
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });
  }
}

export function spawnSparkle(scene, x, y) {
  spawnRewardBurst(scene, x, y, 10);
}

export default spawnRewardBurst;
