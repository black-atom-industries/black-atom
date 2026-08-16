use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::thread::{self, JoinHandle};
use std::time::Duration;

const DEFAULT_PORT: u16 = 1422;
const MAX_HEADER_BYTES: usize = 16 * 1024;
const MAX_BODY_BYTES: usize = 4 * 1024 * 1024;
const PATH_PREFIX: &str = "/__livery/invoke/";

pub struct DevBridge {
    stop: Arc<AtomicBool>,
    port: u16,
    thread: Option<JoinHandle<()>>,
}

impl Drop for DevBridge {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Release);
        let _ = TcpStream::connect(("127.0.0.1", self.port));
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

pub fn start() -> Option<DevBridge> {
    let token = std::env::var("LIVERY_DEV_BRIDGE_TOKEN").ok()?;
    if token.is_empty() {
        return None;
    }

    let port = std::env::var("LIVERY_DEV_BRIDGE_PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(DEFAULT_PORT);
    let listener = TcpListener::bind(("127.0.0.1", port)).ok()?;
    listener.set_nonblocking(true).ok()?;

    let stop = Arc::new(AtomicBool::new(false));
    let thread_stop = Arc::clone(&stop);
    let thread_token = Arc::new(token);
    let accept_thread = thread::Builder::new()
        .name("livery-dev-bridge".to_string())
        .spawn(move || {
            while !thread_stop.load(Ordering::Acquire) {
                match listener.accept() {
                    Ok((stream, _)) => {
                        let token = Arc::clone(&thread_token);
                        let _ = thread::Builder::new()
                            .name("livery-dev-request".to_string())
                            .spawn(move || handle_connection(stream, &token));
                    }
                    Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                        thread::sleep(Duration::from_millis(25));
                    }
                    Err(error) => {
                        log::warn!("Livery dev bridge stopped: {error}");
                        break;
                    }
                }
            }
        })
        .ok()?;

    log::info!("Livery dev bridge listening on http://127.0.0.1:{port}");
    Some(DevBridge {
        stop,
        port,
        thread: Some(accept_thread),
    })
}

struct Request {
    method: String,
    path: String,
    token: Option<String>,
    body: Vec<u8>,
}

fn handle_connection(mut stream: TcpStream, token: &str) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let result = read_request(&mut stream).and_then(|request| process_request(request, token));
    match result {
        Ok(body) => write_json(&mut stream, 200, &body),
        Err((status, message)) => write_json(&mut stream, status, &json!({ "error": message })),
    }
}

fn process_request(request: Request, expected_token: &str) -> Result<Value, (u16, String)> {
    if request.method == "OPTIONS" {
        return Ok(Value::Null);
    }
    if request.method != "POST" {
        return Err((405, "Only POST is supported".to_string()));
    }
    if request.token.as_deref() != Some(expected_token) {
        return Err((401, "Invalid development bridge token".to_string()));
    }

    let Some(command) = request.path.strip_prefix(PATH_PREFIX) else {
        return Err((404, "Unknown development bridge path".to_string()));
    };
    let args: Value = serde_json::from_slice(&request.body)
        .map_err(|error| (400, format!("Invalid command arguments: {error}")))?;

    dispatch(command, args).map_err(|error| (500, error))
}

fn dispatch(command: &str, args: Value) -> Result<Value, String> {
    match command {
        "get_config" => to_value(crate::config::commands::get_config()),
        "save_config" => {
            crate::config::commands::save_config(argument(&args, "config")?)?;
            Ok(Value::Null)
        }
        "download_theme" => {
            let app = argument(&args, "app")?;
            to_value(tauri::async_runtime::block_on(
                crate::themes::commands::download_theme(app),
            ))
        }
        "get_themes_status" => to_value(tauri::async_runtime::block_on(
            crate::themes::commands::get_themes_status(),
        )),
        "link_app_themes" => {
            let app = argument(&args, "app")?;
            to_value(tauri::async_runtime::block_on(
                crate::themes::commands::link_app_themes(app),
            ))
        }
        "dismiss_themes_greeting" => {
            tauri::async_runtime::block_on(crate::themes::commands::dismiss_themes_greeting())?;
            Ok(Value::Null)
        }
        "detect_apps" => to_value(tauri::async_runtime::block_on(
            crate::themes::detect::detect_apps(),
        )),
        "update_app" => {
            let app = argument(&args, "app")?;
            let theme = argument(&args, "theme")?;
            to_value(tauri::async_runtime::block_on(crate::updaters::update_app(
                app, theme,
            )))
        }
        "update_system_appearance" => {
            let appearance = argument(&args, "appearance")?;
            to_value(crate::updaters::update_system_appearance(appearance))
        }
        "verify_app_path" => {
            let app = argument(&args, "app")?;
            to_value(tauri::async_runtime::block_on(
                crate::updaters::verify_app_path(app),
            ))
        }
        "plugin:path|resolve_directory" => {
            let directory: u8 = argument(&args, "directory")?;
            if directory == 21 {
                dirs::home_dir()
                    .map(|path| path.to_string_lossy().into_owned())
                    .ok_or_else(|| "Could not determine the home directory".to_string())
                    .map(Value::String)
            } else {
                Err(format!(
                    "Path directory {directory} is not supported in Airship"
                ))
            }
        }
        "plugin:dialog|open" => Ok(Value::Null),
        _ => Err(format!("Unsupported development bridge command: {command}")),
    }
}

fn argument<T: DeserializeOwned>(args: &Value, name: &str) -> Result<T, String> {
    let value = args
        .get(name)
        .cloned()
        .ok_or_else(|| format!("Missing command argument: {name}"))?;
    serde_json::from_value(value)
        .map_err(|error| format!("Invalid command argument {name}: {error}"))
}

fn to_value<T: serde::Serialize>(value: T) -> Result<Value, String> {
    serde_json::to_value(value)
        .map_err(|error| format!("Could not serialize command result: {error}"))
}

fn read_request(stream: &mut TcpStream) -> Result<Request, (u16, String)> {
    let mut bytes = Vec::new();
    let header_end = loop {
        let mut chunk = [0; 4096];
        let read = stream
            .read(&mut chunk)
            .map_err(|error| (400, format!("Could not read request: {error}")))?;
        if read == 0 {
            return Err((400, "Request ended before its headers".to_string()));
        }
        bytes.extend_from_slice(&chunk[..read]);
        if bytes.len() > MAX_HEADER_BYTES {
            return Err((413, "Request headers are too large".to_string()));
        }
        if let Some(index) = bytes.windows(4).position(|window| window == b"\r\n\r\n") {
            break index + 4;
        }
    };

    let header_text = std::str::from_utf8(&bytes[..header_end])
        .map_err(|_| (400, "Request headers are not valid UTF-8".to_string()))?;
    let mut lines = header_text.split("\r\n");
    let request_line = lines
        .next()
        .ok_or_else(|| (400, "Missing request line".to_string()))?;
    let mut request_parts = request_line.split_whitespace();
    let method = request_parts
        .next()
        .ok_or_else(|| (400, "Missing request method".to_string()))?
        .to_string();
    let path = request_parts
        .next()
        .ok_or_else(|| (400, "Missing request path".to_string()))?
        .split('?')
        .next()
        .unwrap_or_default()
        .to_string();

    let mut content_length = 0usize;
    let mut token = None;
    for line in lines {
        let Some((name, value)) = line.split_once(':') else {
            continue;
        };
        match name.to_ascii_lowercase().as_str() {
            "content-length" => {
                content_length = value
                    .trim()
                    .parse()
                    .map_err(|_| (400, "Invalid content length".to_string()))?;
            }
            "x-livery-dev-token" => token = Some(value.trim().to_string()),
            _ => {}
        }
    }
    if content_length > MAX_BODY_BYTES {
        return Err((413, "Request body is too large".to_string()));
    }

    while bytes.len() - header_end < content_length {
        let mut chunk = [0; 4096];
        let read = stream
            .read(&mut chunk)
            .map_err(|error| (400, format!("Could not read request body: {error}")))?;
        if read == 0 {
            return Err((400, "Request ended before its body".to_string()));
        }
        bytes.extend_from_slice(&chunk[..read]);
    }

    Ok(Request {
        method,
        path,
        token,
        body: bytes[header_end..header_end + content_length].to_vec(),
    })
}

fn write_json(stream: &mut TcpStream, status: u16, body: &Value) {
    let bytes = serde_json::to_vec(body)
        .unwrap_or_else(|_| b"{\"error\":\"serialization failed\"}".to_vec());
    let reason = match status {
        200 => "OK",
        204 => "No Content",
        400 => "Bad Request",
        401 => "Unauthorized",
        404 => "Not Found",
        405 => "Method Not Allowed",
        413 => "Payload Too Large",
        _ => "Internal Server Error",
    };
    let header = format!(
        "HTTP/1.1 {status} {reason}\r\ncontent-type: application/json\r\ncontent-length: {}\r\naccess-control-allow-origin: *\r\naccess-control-allow-headers: content-type, x-livery-dev-token\r\nconnection: close\r\n\r\n",
        bytes.len()
    );
    let _ = stream.write_all(header.as_bytes());
    let _ = stream.write_all(&bytes);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dispatches_home_directory_for_browser_path_helpers() {
        let result = dispatch("plugin:path|resolve_directory", json!({ "directory": 21 })).unwrap();

        assert_eq!(result, json!(dirs::home_dir().unwrap().to_string_lossy()));
    }

    #[test]
    fn rejects_commands_that_are_not_exposed() {
        let error = dispatch("delete_everything", Value::Null).unwrap_err();

        assert_eq!(
            error,
            "Unsupported development bridge command: delete_everything"
        );
    }
}
