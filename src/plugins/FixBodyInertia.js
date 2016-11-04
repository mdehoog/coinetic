import Matter, {Axes, Vertices, Bounds, Body} from 'matter-js';

const FixBodyInertia = {
    name: 'fix-body-inertia',

    version: '0.1.0',

    install: (base) => {
        base.Body.scale = FixBodyInertia.Body.scale;
    },

    Body: {
        //this is a copy of the standard Body.scale method, but with the interia
        //updating removed, because it makes the body unstable (jittery)
        scale(body, scaleX, scaleY) {
            let totalArea = 0, totalMass = 0;

            body.parts.forEach((part) => {
                // scale vertices
                Vertices.scale(part.vertices, scaleX, scaleY, body.position);

                // update properties
                part.axes = Axes.fromVertices(part.vertices);

                if (!body.isStatic) {
                    part.area = Vertices.area(part.vertices);
                    Body.setMass(part, body.density * part.area);
                    totalArea += part.area;
                    totalMass += part.mass;
                }

                // update bounds
                Bounds.update(part.bounds, part.vertices, body.velocity);
            });

            if (!body.isStatic) {
                body.area = totalArea;
                Body.setMass(body, totalMass);
            }
        }
    }
};

Matter.Plugin.register(FixBodyInertia);
