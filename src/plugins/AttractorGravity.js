import Matter, {Composite, Vector} from 'matter-js';

const AttractorGravity = {
    name: 'attractor-gravity',

    version: '0.1.0',

    install(base) {
        base.after('Engine.update', function () {
            AttractorGravity.Engine.update(this);
        });
    },

    Engine: {
        update(engine) {
            const bodies = Composite.allBodies(engine.world);
            bodies.forEach((body) => {
                if (body.gravity) {
                    const attractors = body.gravity.attractors || [];
                    if (attractors.length) {
                        this.attractorGravity(body);
                    } else {
                        this.positionGravity(body);
                    }
                }
            });
        },
        positionGravity(body) {
            const gravity = {x: body.gravity.x, y: body.gravity.y};
            gravity.x = gravity.x || gravity.x === 0 ? gravity.x : body.position.x;
            gravity.y = gravity.y || gravity.y === 0 ? gravity.y : body.position.y;
            const delta = Vector.sub(gravity, body.position);
            this.applyGravity(body, delta);
        },
        attractorGravity(body) {
            let x = 0, y = 0;
            const attractors = body.gravity.attractors;
            attractors.forEach((attractor) => {
                x += attractor.position.x;
                y += attractor.position.y;
            });
            x /= attractors.length;
            y /= attractors.length;
            const delta = Vector.sub({x: x, y: y}, body.position);
            this.applyGravity(body, delta);
        },
        applyGravity(body, point) {
            const scale = body.gravity.scale || 0.001;
            const mag = Vector.magnitude(point);
            if (mag > 0) {
                body.force.x += body.mass * point.x * scale / mag;
                body.force.y += body.mass * point.y * scale / mag;
            }
        }
    }
};

Matter.Plugin.register(AttractorGravity);
