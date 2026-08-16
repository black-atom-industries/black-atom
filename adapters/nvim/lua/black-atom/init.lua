local M = {}

---The theme definition applied by the most recent `load`. Nil before the first
---colorscheme is set. Consumers outside the highlight modules (the lualine
---theme) read their colors from here.
---@type BlackAtom.Theme.Definition | nil
M.theme = nil

---The resolved config the most recent `load` ran with.
---@type BlackAtom.Config | nil
M.config = nil

---Loads a theme definition into the editor
---@param theme BlackAtom.Theme.Definition
---@return nil
function M.load(theme)
    local config = require("black-atom.config").resolve()
    local highlights = require("black-atom.highlights")

    M.theme = theme
    M.config = config

    highlights.reset()

    vim.g.colors_name = theme.meta.key
    vim.opt.termguicolors = true
    vim.opt.background = theme.meta.appearance

    highlights.apply(theme.colors, config)
end

return M
