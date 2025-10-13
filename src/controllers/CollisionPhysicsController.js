import Matter from 'matter-js';
import gsap from 'gsap';

export class CollisionPhysicsController {
  constructor(sprite, config, screenWidth, screenHeight) {
    this.sprite = sprite;
    this.config = config;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.engine = Matter.Engine.create();
    this.engine.gravity.y = config.GRAVITY;

    this.walls = this.createWalls();
    Matter.World.add(this.engine.world, this.walls);

    this.body = null;
    this.obstacleBody = null;
    this.active = false;
    this.callback = null;
    this.stopTimeout = null;

    this.originalX = sprite.x;
    this.originalY = sprite.y;
  }

  createWalls() {
    const cfg = this.config;
    return [
      Matter.Bodies.rectangle(
        cfg.LEFT_WALL_X,
        this.screenHeight / 2,
        100,
        this.screenHeight,
        {
          isStatic: true,
          restitution: cfg.WALL_RESTITUTION,
          label: 'leftWall'
        }
      ),
      Matter.Bodies.rectangle(
        this.screenWidth / 2,
        this.screenHeight + 50,
        this.screenWidth,
        100,
        {
          isStatic: true,
          label: 'floor'
        }
      ),
      Matter.Bodies.rectangle(
        this.screenWidth / 2,
        -50,
        this.screenWidth,
        100,
        {
          isStatic: true,
          label: 'ceiling'
        }
      )
    ];
  }

  activate(obstacleSprite, callback) {
    this.active = true;
    this.callback = callback;
    this.originalX = this.sprite.x;
    this.originalY = this.sprite.y;

    console.log('💥 Collision physics activated!');

    if (this.body) {
      Matter.World.remove(this.engine.world, this.body);
    }
    if (this.obstacleBody) {
      Matter.World.remove(this.engine.world, this.obstacleBody);
    }

    const cfg = this.config;

    this.obstacleBody = Matter.Bodies.rectangle(
      obstacleSprite.x,
      obstacleSprite.y,
      obstacleSprite.width * 0.8,
      obstacleSprite.height * 0.8,
      {
        isStatic: true,
        restitution: cfg.WALL_RESTITUTION,
        label: 'obstacle'
      }
    );

    this.body = Matter.Bodies.rectangle(
      this.sprite.x,
      this.sprite.y,
      this.sprite.width * 0.7,
      this.sprite.height * 0.7,
      {
        friction: cfg.FRICTION,
        frictionAir: cfg.FRICTION_AIR,
        restitution: cfg.RESTITUTION,
        density: 0.001,
        label: 'player'
      }
    );

    Matter.World.add(this.engine.world, [this.obstacleBody, this.body]);

    Matter.Body.setVelocity(this.body, {
      x: 5,
      y: 0
    });

    this.stopTimeout = setTimeout(() => {
      this.forceStop();
    }, cfg.MAX_PHYSICS_DURATION);
  }

  update(deltaTime) {
    if (!this.active || !this.body) return;

    Matter.Engine.update(this.engine, deltaTime * 1000);

    this.sprite.x = this.body.position.x;
    this.sprite.y = this.body.position.y;

    Matter.Body.setAngle(this.body, 0);
    Matter.Body.setAngularVelocity(this.body, 0);

    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    if (speed < this.config.MIN_VELOCITY_STOP) {
      this.forceStop();
    }
  }

  forceStop() {
    if (!this.active) return;

    console.log('🛑 Forcing stop, returning to original position');

    clearTimeout(this.stopTimeout);

    if (this.body) {
      Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(this.body, 0);
      Matter.Body.setAngle(this.body, 0);
    }

    this.sprite.rotation = 0;

    gsap.to(this.sprite, {
      x: this.originalX,
      y: this.originalY,
      duration: this.config.RETURN_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        console.log('✅ Returned to position, calling callback');
        this.deactivate();
        if (this.callback) this.callback();
      }
    });
  }

  deactivate() {
    this.active = false;
    clearTimeout(this.stopTimeout);

    if (this.body) {
      Matter.World.remove(this.engine.world, this.body);
      this.body = null;
    }
    if (this.obstacleBody) {
      Matter.World.remove(this.engine.world, this.obstacleBody);
      this.obstacleBody = null;
    }
  }

  isActive() {
    return this.active;
  }

  destroy() {
    this.deactivate();
    Matter.World.clear(this.engine.world);
    Matter.Engine.clear(this.engine);
  }
}
