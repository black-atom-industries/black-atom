local M = {}

---@type BlackAtom.Config
M.defaults = {
    term_colors = true,
    styles = {
        ending_tildes = false,
        cmp_kind_color_mode = "bg",
        dark_sidebars = true,
        dark_floats = true,
        dark_gutter = false,
        gutter_padding = 0,
        transparency = "none",
        diagnostics = {
            undercurl = false,
            background = false,
        },
        syntax = {
            comments = {
                italic = true,
            },
            keywords = {
                bold = true,
            },
            functions = {},
            strings = {
                italic = false,
            },
            variables = {},
            messages = {
                bold = true,
            },
        },
    },
}

---A JSON object or Lua table that can take part in a merge; anything else
---(`vim.NIL`, a scalar, an array) counts as absent.
---@param value any
---@return table
local function as_dict(value)
    if type(value) == "table" and (next(value) == nil or not vim.islist(value)) then
        return value
    end

    return {}
end

---Merges, in increasing precedence, the defaults, `apps.nvim.settings` from
---Livery's `config.json`, and `vim.g.black_atom_core_config`. Neither source is
---written back, so a user's partial table stays partial.
---@return BlackAtom.Config
function M.resolve()
    local livery = require("black-atom.livery").read()
    local settings = as_dict(vim.tbl_get(livery or {}, "apps", "nvim", "settings"))

    return vim.tbl_deep_extend("force", M.defaults, settings, as_dict(vim.g.black_atom_core_config))
end

return M
