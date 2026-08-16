use std::collections::BTreeMap;
use std::time::{Duration, Instant};

use livery_lib::config::io as config_io;
use livery_lib::config::types::AppName;
use livery_lib::updaters::{dispatch_update, nvim, system_appearance, UpdateContext, UpdateStatus};

// Theme key, appearance, collection key, Zed theme label.
// Labels match @black-atom/core computeLabel():
//   Default collection: "Black Atom — {name}"
//   Other collections:  "Black Atom — {COLLECTION} ∷ {name}"
const THEMES: &[(&str, &str, &str, &str)] = &[
    (
        "black-atom-terra-fall-night",
        "dark",
        "terra",
        "Black Atom — TERRA ∷ Fall Night",
    ),
    (
        "black-atom-terra-spring-day",
        "light",
        "terra",
        "Black Atom — TERRA ∷ Spring Day",
    ),
    (
        "black-atom-jpn-koyo-yoru",
        "dark",
        "jpn",
        "Black Atom — JPN ∷ Koyo Yoru",
    ),
    (
        "black-atom-jpn-koyo-hiru",
        "light",
        "jpn",
        "Black Atom — JPN ∷ Koyo Hiru",
    ),
    (
        "black-atom-default-dark",
        "dark",
        "default",
        "Black Atom — Dark",
    ),
];

fn main() {
    let iterations = parse_iterations();

    eprintln!("⚠ This benchmark writes to your real config files and triggers app reloads.");
    eprintln!();

    // Read config
    let mut config = config_io::read_config_from_disk();
    config_io::expand_app_paths(&mut config);

    // Collect enabled apps
    let enabled_apps: Vec<_> = AppName::all()
        .iter()
        .filter(|app| config.apps.get(app).map(|c| c.enabled).unwrap_or(false))
        .copied()
        .collect();

    eprintln!(
        "Benchmarking {} apps: {}",
        enabled_apps.len(),
        enabled_apps
            .iter()
            .map(|a| a.as_str())
            .collect::<Vec<_>>()
            .join(", ")
    );
    if config.system_appearance {
        eprintln!("+ system_appearance");
    }
    eprintln!("{iterations} iterations");
    eprintln!();

    // Timing storage: app_name -> Vec<ms>
    let mut timings: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    let mut total_times: Vec<u32> = Vec::new();

    for i in 0..iterations {
        let (theme_key, appearance, collection_key, theme_label) = THEMES[i % THEMES.len()];

        let iter_start = Instant::now();

        for &app in &enabled_apps {
            let app_config = match config.apps.get(&app) {
                Some(c) => c.clone(),
                None => continue,
            };

            let ctx = UpdateContext {
                theme_key,
                appearance,
                collection_key,
                theme_label: Some(theme_label),
                themes_path: app_config.themes_path.clone(),
            };

            let start = Instant::now();
            // For nvim, send to only one instance so timing is independent of open instance count
            let result = if app == AppName::Nvim {
                nvim::update(app.as_str(), &app_config, &ctx, Some(1))
            } else {
                dispatch_update(app, &app_config, &ctx)
            };
            let elapsed = start.elapsed().as_millis() as u32;

            let status_str = match result.status {
                UpdateStatus::Error => " ERROR",
                UpdateStatus::Skipped => " SKIP",
                _ => "",
            };

            if result.status == UpdateStatus::Error {
                eprintln!(
                    "  [{}/{}] {}: {}ms{} — {}",
                    i + 1,
                    iterations,
                    app.as_str(),
                    elapsed,
                    status_str,
                    result.message.as_deref().unwrap_or("unknown error")
                );
            } else {
                eprint!(
                    "  [{}/{}] {}: {}ms{}\r",
                    i + 1,
                    iterations,
                    app.as_str(),
                    elapsed,
                    status_str
                );
            }

            timings
                .entry(app.as_str().to_string())
                .or_default()
                .push(elapsed);
        }

        // System appearance
        if config.system_appearance {
            let start = Instant::now();
            system_appearance::update(appearance);
            let elapsed = start.elapsed().as_millis() as u32;

            timings
                .entry("system_appearance".to_string())
                .or_default()
                .push(elapsed);
        }

        let iter_elapsed = iter_start.elapsed().as_millis() as u32;
        total_times.push(iter_elapsed);

        // Pause between iterations to let apps settle and reduce OS scheduling noise
        if i < iterations - 1 {
            std::thread::sleep(Duration::from_secs(1));
        }
    }

    eprintln!();

    // Build summary
    let mut lines: Vec<(String, u32, u32, u32)> = Vec::new();

    for (app, times) in &timings {
        let (avg, min, max) = stats(times);
        lines.push((app.clone(), avg, min, max));
    }

    // Sort by avg time descending (slowest first)
    lines.sort_by_key(|line| std::cmp::Reverse(line.1));

    let (total_avg, total_min, total_max) = stats(&total_times);

    // Print to stdout
    println!();
    print_table(&lines, total_avg, total_min, total_max);
    println!();

    // Write to docs/benchmarks.md
    let commit = git_short_hash();
    let date = current_datetime();
    let app_count = enabled_apps.len() + if config.system_appearance { 1 } else { 0 };

    write_benchmark_entry(
        &commit, &date, iterations, app_count, &lines, total_avg, total_min, total_max,
    );

    eprintln!("Results written to docs/benchmarks.md");
}

const MIN_ITERATIONS: usize = 5;

fn parse_iterations() -> usize {
    let args: Vec<String> = std::env::args().collect();
    for i in 0..args.len() {
        if args[i] == "--iterations" {
            if let Some(n) = args.get(i + 1) {
                let parsed = match n.parse::<usize>() {
                    Ok(v) => v,
                    Err(_) => {
                        eprintln!("Warning: invalid --iterations value '{n}', using default (10)");
                        10
                    }
                };
                return parsed.max(MIN_ITERATIONS);
            }
        }
    }
    10
}

fn stats(times: &[u32]) -> (u32, u32, u32) {
    if times.is_empty() {
        return (0, 0, 0);
    }
    let sum: u32 = times.iter().sum();
    let avg = sum / times.len() as u32;
    let min = *times.iter().min().unwrap();
    let max = *times.iter().max().unwrap();
    (avg, min, max)
}

fn print_table(lines: &[(String, u32, u32, u32)], total_avg: u32, total_min: u32, total_max: u32) {
    println!("| App | Avg | Min | Max |");
    println!("|-|-|-|-|");
    for (app, avg, min, max) in lines {
        println!("| {} | {} | {} | {} |", app, avg, min, max);
    }
    println!(
        "| **TOTAL** | {} | {} | {} |",
        total_avg, total_min, total_max
    );
}

fn git_short_hash() -> String {
    std::process::Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

fn current_datetime() -> String {
    std::process::Command::new("date")
        .args(["+%Y-%m-%d %H:%M"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

#[allow(clippy::too_many_arguments)]
fn write_benchmark_entry(
    commit: &str,
    date: &str,
    iterations: usize,
    app_count: usize,
    lines: &[(String, u32, u32, u32)],
    total_avg: u32,
    total_min: u32,
    total_max: u32,
) {
    // Build the new entry
    let mut entry = String::new();
    entry.push_str(&format!("## {} — {}\n\n", commit, date));
    entry.push_str(&format!(
        "{} iterations, {} apps enabled\n\n",
        iterations, app_count
    ));
    entry.push_str("| App | Avg | Min | Max |\n");
    entry.push_str("|-|-|-|-|\n");
    for (app, avg, min, max) in lines {
        entry.push_str(&format!("| {} | {} | {} | {} |\n", app, avg, min, max));
    }
    entry.push_str(&format!(
        "| **TOTAL** | {} | {} | {} |\n",
        total_avg, total_min, total_max
    ));

    // Find docs/benchmarks.md relative to the git root
    let repo_root = std::process::Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| ".".to_string());

    let docs_dir = format!("{}/docs", repo_root);
    let file_path = format!("{}/benchmarks.md", docs_dir);

    // Ensure docs/ exists
    let _ = std::fs::create_dir_all(&docs_dir);

    // Read existing content
    let existing = std::fs::read_to_string(&file_path).unwrap_or_default();

    // Prepend after the header line
    let header = "# Benchmark History\n";
    let content = if existing.contains("# Benchmark History") {
        let after_header = existing
            .find("# Benchmark History")
            .map(|i| {
                let line_end = existing[i..].find('\n').unwrap_or(existing.len() - i);
                i + line_end + 1
            })
            .unwrap_or(0);
        format!(
            "{}\n{}\n{}",
            &existing[..after_header],
            entry,
            &existing[after_header..]
        )
    } else {
        format!("{}\n{}\n{}", header, entry, existing)
    };

    std::fs::write(&file_path, &content).expect("Failed to write docs/benchmarks.md");

    // Format with prettier
    let _ = std::process::Command::new("npx")
        .args(["prettier", "--write", &file_path])
        .output();
}
