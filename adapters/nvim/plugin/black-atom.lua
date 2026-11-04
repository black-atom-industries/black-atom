if vim.g.loaded_black_atom then
    return
end
vim.g.loaded_black_atom = true

if vim.g.colors_name then
    return
end

local theme = (require("black-atom.livery").read() or {}).active_theme
if type(theme) ~= "string" then
    return
end

local ok, err = pcall(vim.cmd.colorscheme, theme)
if not ok then
    vim.notify(("black-atom: could not apply %q: %s"):format(theme, err), vim.log.levels.WARN)
end
