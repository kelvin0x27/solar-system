const { Astronomy, Body } = require('astronomy-engine');
const now = new Date();
const illum = Astronomy.Illumination(Body.Moon, now);
console.log("Fraction:", illum.phase_fraction);
console.log("Phase angle:", illum.phase_angle);
