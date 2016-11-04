import Matter, {Composite, Body} from 'matter-js';

const EnforceWorldBounds = {
    name: 'enforce-world-bounds',

    version: '0.1.0',

    install(base) {
        base.after('Engine.update', function () {
            EnforceWorldBounds.Engine.update(this);
        });
    },

    Engine: {
        update(engine) {
            const bounds = engine.world.bounds;
            if (!bounds) {
                return;
            }
            const bodies = Composite.allBodies(engine.world);
            bodies.forEach((body) => {
                if (!body.isStatic) {
                    const x = body.position.x;
                    const y = body.position.y;
                    const nx = Math.min(Math.max(x, bounds.min.x), bounds.max.x);
                    const ny = Math.min(Math.max(y, bounds.min.y), bounds.max.y);
                    if (x !== nx || y !== ny) {
                        Body.setPosition(body, {x: nx, y: ny});
                    }
                }
            });
        }
    }
};

Matter.Plugin.register(EnforceWorldBounds);
