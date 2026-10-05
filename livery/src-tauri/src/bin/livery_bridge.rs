//! Headless dev bridge: serves the Tauri commands over HTTP without a window,
//! so a browser on the Vite dev server drives the real backend. Debug builds only.

#[cfg(debug_assertions)]
fn main() {
    if let Err(error) = livery_core::themes::unpack::ensure_unpacked() {
        eprintln!("livery-bridge: failed to unpack the bundled themes: {error}");
        std::process::exit(1);
    }

    let Some(_bridge) = livery_lib::dev_bridge::start() else {
        eprintln!(
            "livery-bridge: could not start; set LIVERY_DEV_BRIDGE_TOKEN and a free LIVERY_DEV_BRIDGE_PORT"
        );
        std::process::exit(1);
    };

    eprintln!("livery-bridge: listening");
    loop {
        std::thread::park();
    }
}

#[cfg(not(debug_assertions))]
fn main() {
    eprintln!("livery-bridge: only available in debug builds");
    std::process::exit(1);
}
