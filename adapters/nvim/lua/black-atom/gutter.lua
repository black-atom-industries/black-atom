local M = {}

---Adds `gutter_padding` blank cells to the end of a 'statuscolumn' format.
---Runs for every screen row, so it reads the config the last `:colorscheme` resolved.
---@param base string The column format to pad
---@return string
function M.pad(base)
    local config = require("black-atom").config

    if not config or not config.dark_gutter or config.gutter_padding == 0 then
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

    return base .. group .. string.rep(" ", config.gutter_padding)
end

---The default columns (folds, signs, line number) with the padding added.
---The number is drawn only when the window shows numbers, since a
---'statuscolumn' would otherwise put one in every window.
---@return string
function M.column()
    local wo = vim.wo[vim.g.statusline_winid]
    local tail = ""

    if wo.number or wo.relativenumber then
        tail = vim.v.virtnum > 0 and "%= " or "%=%l "
    end

    return M.pad("%C%s" .. tail)
end

local COLUMN = "%!v:lua.require'black-atom.gutter'.column()"

---Calls `set` with each normal, non-floating window.
---@param set fun(win: integer)
local function each_editor_window(set)
    for _, win in ipairs(vim.api.nvim_list_wins()) do
        local editor = vim.api.nvim_win_get_config(win).relative == ""
            and vim.bo[vim.api.nvim_win_get_buf(win)].buftype == ""

        if editor then
            set(win)
        end
    end
end

---Turns the padded column on while the config asks for padding, and off again
---when it stops. A 'statuscolumn' set by the user stays untouched.
---@param config BlackAtom.Config
function M.apply(config)
    local wanted = config.dark_gutter and config.gutter_padding > 0
    local global = vim.go.statuscolumn

    if wanted and global == "" then
        vim.go.statuscolumn = COLUMN
        each_editor_window(function(win)
            if vim.wo[win].statuscolumn == "" then
                vim.wo[win].statuscolumn = COLUMN
            end
        end)
    elseif not wanted and global == COLUMN then
        vim.go.statuscolumn = ""
        each_editor_window(function(win)
            if vim.wo[win].statuscolumn == COLUMN then
                vim.wo[win].statuscolumn = ""
            end
        end)
    end
end

return M
