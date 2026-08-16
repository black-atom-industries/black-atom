local M = {}

---Reset all highlights.
---@return nil
function M.reset()
    -- Clear all highlights
    vim.cmd("hi clear")

    -- Reset syntax highlighting
    if vim.fn.exists("syntax_on") then
        vim.cmd("syntax reset")
    end
end

---Applies the highlights for the theme based on the current configuration.
---@param colors BlackAtom.Theme.Colors
---@param config BlackAtom.Config
---@return nil
function M.apply(colors, config)
    local highlights_lib = require("black-atom.lib.highlights")

    -- Terminal colors are vim.g variables, not nvim_set_hl
    if config.term_colors then
        highlights_lib.set_term(colors)
    end

    highlights_lib.set(highlights_lib.build_highlights_map(colors, config))
end

return M
