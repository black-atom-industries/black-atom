const tileSize = 220;
const frameCount = 6;
const frameMs = 83;

export interface Grain {
    setLight(isLight: boolean): void;
    /** Steps the film grain to another frame at most every `frameMs`. */
    tick(now: number): void;
    dispose(): void;
}

function blurredTile(source: HTMLCanvasElement): string {
    const tile = document.createElement("canvas");
    tile.width = tile.height = tileSize;
    const context = tile.getContext("2d");
    if (!context) return "";
    context.filter = "blur(0.9px)";
    for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) context.drawImage(source, ox * tileSize, oy * tileSize);
    }
    return `url(${tile.toDataURL()})`;
}

function paint(data: Uint8ClampedArray, noise: Float32Array, level: (n: number) => number) {
    for (let p = 0; p < noise.length; p++) {
        const v = level(noise[p] ?? 0);
        data[p * 4] = data[p * 4 + 1] = data[p * 4 + 2] = v;
        data[p * 4 + 3] = 255;
    }
}

function renderFrames(): { dark: string[]; light: string[] } {
    const source = document.createElement("canvas");
    source.width = source.height = tileSize;
    const context = source.getContext("2d");
    const dark: string[] = [];
    const light: string[] = [];
    if (!context) return { dark, light };
    for (let f = 0; f < frameCount; f++) {
        const image = context.createImageData(tileSize, tileSize);
        const noise = Float32Array.from({ length: tileSize * tileSize }, () => Math.random());
        paint(image.data, noise, (n) => (n * 255) | 0);
        context.putImageData(image, 0, 0);
        dark.push(blurredTile(source));
        paint(image.data, noise, (n) => 255 - ((Math.pow(n, 1.6) * 120) | 0));
        context.putImageData(image, 0, 0);
        light.push(blurredTile(source));
    }
    return { dark, light };
}

/**
 * Film grain over the whole page, above the content, as in the design. Soft light on dark
 * themes, a lighter multiply on light ones.
 */
export function createGrain(): Grain {
    const frames = renderFrames();
    const element = document.createElement("div");
    element.setAttribute("aria-hidden", "true");
    element.style.cssText = `position:fixed;inset:0;z-index:2147483000;pointer-events:none;background-size:calc(${tileSize}px * var(--grain-size, .9))`;
    let isLight = false;
    let index = 0;
    let lastStep = 0;

    function show() {
        element.style.mixBlendMode = isLight ? "multiply" : "soft-light";
        element.style.backgroundImage = (isLight ? frames.light : frames.dark)[index] ?? "";
        element.style.opacity = isLight ? "calc(var(--grain, .22) * .5)" : "var(--grain, .22)";
    }

    show();
    document.body.appendChild(element);

    return {
        setLight(next) {
            isLight = next;
            show();
        },
        tick(now) {
            if (now - lastStep < frameMs) return;
            lastStep = now;
            index = (index + 1 + Math.floor(Math.random() * (frameCount - 1))) % frameCount;
            show();
        },
        dispose() {
            element.remove();
        },
    };
}
