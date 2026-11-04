local M = {}

---Adds `styles.gutter_padding` blank cells to the end of a 'statuscolumn' format.
---Runs for every screen row, so it reads the config the last `:colorscheme` resolved.
---@param base string The column format to pad
---@return string
function M.pad(base)
    local config = require("black-atom").config

    if not config or not config.styles.dark_gutter or config.styles.gutter_padding == 0 then
        return base
    end

    local win = vim.g.statusline_winid
    local wo = vim.wo[win]
    local gutter = wo.number or wo.relativenumber or wo.signcolumn ~= "no"

    -- `Normal` would show as a notch on a float's panel background.
    if not gutter or vim.api.nvim_win_get_config(win).relative ~= "" then
        return base
    end

    local on_cursor = wo.cursorline and vim.v.relnum == 0 and vim.v.virtnum <= 0
    local group = on_cursor and "%#CursorLine#" or "%#Normal#"

    return base .. group .. string.rep(" ", config.styles.gutter_padding)
end

return M
