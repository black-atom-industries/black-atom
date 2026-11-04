local M = {}

local warned = false

---Mirrors `config_home` in `livery/core/src/paths.rs`: an empty or relative
---`$XDG_CONFIG_HOME` is ignored.
---@return string
function M.path()
    local xdg = vim.env.XDG_CONFIG_HOME
    local base = (xdg and vim.startswith(xdg, "/")) and xdg or vim.fs.joinpath(vim.fn.expand("~"), ".config")

    return vim.fs.joinpath(base, "black-atom", "livery", "config.json")
end

---Reads Livery's config file fresh, so a `:colorscheme` after a live reload
---sees the new values. A missing file is normal and silent. Invalid JSON warns
---once until a read succeeds again.
---@return BlackAtom.LiveryConfig | nil
function M.read()
    local file = io.open(M.path(), "r")
    if not file then
        return nil
    end
    local text = file:read("*a")
    file:close()

    local ok, decoded = pcall(vim.json.decode, text, { luanil = { object = true, array = true } })
    if ok and type(decoded) == "table" then
        warned = false
        return decoded
    end

    if not warned then
        warned = true
        vim.notify("black-atom: ignoring invalid JSON in " .. M.path(), vim.log.levels.WARN)
    end

    return nil
end

return M
