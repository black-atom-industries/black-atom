/** The tuned look of the background space and its black hole. */
export interface Look {
    /** Seconds a singing line takes to fade after its note ends. */
    singDecay: number;
    singGlow: number;
    /** How strongly lines crossing the accretion disk are dragged along its orbit. */
    diskPull: number;
    diskLineGlow: number;
    /** Disk radius and width in hole radii, thickness as a factor. */
    diskRadius: number;
    diskWidth: number;
    diskThickness: number;
    /** Radius of the camera's collision sphere relative to the view distance. */
    camBody: number;
    lineGlow: number;
    /** 0 = sharp pulses along the lines, 1 = wide ones. */
    pulseWidth: number;
    breath: number;
    wind: number;
    ringBlur: number;
    /** Share of the ring particles drawn, 0..1. */
    particles: number;
    lineSat: number;
    /** How far light themes lift the background toward the foreground. */
    lightContrast: number;
    /** Hole radius as a share of the anchor's half width. */
    atomSize: number;
    ringGlow: number;
    /** How dark the hole's core is, 0..1. */
    atomDepth: number;
    lens: number;
    absorb: number;
    lookAround: number;
    /** Orbit speed in degrees per second. */
    orbit: number;
    lineCount: number;
    speed: number;
    parallax: number;
    bloom: number;
    /** Disk tilt in degrees. */
    ringTilt: number;
    dof: number;
    /** How far a kick from the soundscape swells the hole. */
    kickPulse: number;
}

export const look = {
    singDecay: 2.5,
    singGlow: 4.9,
    diskPull: 1.5,
    diskLineGlow: 4,
    diskRadius: 4,
    diskWidth: 2.5,
    diskThickness: 4,
    camBody: 0.6,
    lineGlow: 2,
    pulseWidth: 1,
    breath: 0.6,
    wind: 2,
    ringBlur: 1,
    particles: 1,
    lineSat: 1.2,
    lightContrast: 0.1,
    atomSize: 0.6,
    ringGlow: 2,
    atomDepth: 0.85,
    lens: 1.6,
    absorb: 0.2,
    lookAround: 1.5,
    orbit: 3,
    lineCount: 100,
    speed: 2.1,
    parallax: 2,
    bloom: 2,
    ringTilt: 65,
    dof: 1,
    kickPulse: 0.8,
} as const satisfies Look;
