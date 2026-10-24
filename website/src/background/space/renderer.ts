import { createEmitter } from "#/background/emitter.ts";
import type {
    BackgroundRenderer,
    BackgroundState,
    SceneTheme,
    SingNote,
} from "#/background/types.ts";

export interface SpaceScene {
    setState(state: BackgroundState): void;
    setTheme(theme: SceneTheme): void;
    sing(note: SingNote): void;
    pulse(amount: number): void;
    run(): void;
    pause(): void;
    dispose(): void;
}

type CreateScene = (
    host: HTMLElement,
    isStill: boolean,
    emit: ReturnType<typeof createEmitter>["emit"],
    state: BackgroundState,
) => Promise<SpaceScene>;

/**
 * Runs a space scene as a background renderer. State and theme set before or while the scene
 * starts are held and the latest of each reaches the scene once it exists.
 */
export function createSpaceRenderer(createScene: CreateScene): BackgroundRenderer {
    const events = createEmitter();
    let scene: SpaceScene | undefined;
    let theme: SceneTheme | undefined;
    let state: BackgroundState = { view: "hole", mode: "full" };
    let isDisposed = false;
    let isPaused = false;

    return {
        events,
        async start(host, { isStill }) {
            const startState = state;
            const created = await createScene(
                host,
                isStill,
                (event) => events.emit(event),
                startState,
            );
            if (isDisposed) {
                created.dispose();
                return;
            }
            scene = created;
            if (state !== startState) scene.setState(state);
            if (theme) scene.setTheme(theme);
            if (!isPaused) scene.run();
        },
        setState(next) {
            state = next;
            scene?.setState(next);
        },
        sing(note) {
            scene?.sing(note);
        },
        pulse(amount) {
            scene?.pulse(amount);
        },
        setTheme(next) {
            theme = next;
            scene?.setTheme(next);
        },
        pause() {
            isPaused = true;
            scene?.pause();
        },
        resume() {
            if (!isPaused) return;
            isPaused = false;
            scene?.run();
        },
        dispose() {
            isDisposed = true;
            scene?.dispose();
        },
    };
}
