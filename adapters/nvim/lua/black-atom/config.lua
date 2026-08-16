local M = {}

---@type BlackAtom.Config
M.defaults = {
    term_colors = true,
    styles = {
        ending_tildes = false,
        cmp_kind_color_mode = "bg",
        dark_sidebars = true,
        dark_floats = true,
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

---Merges `vim.g.black_atom_core_config` over the defaults.
---The global is never written back, so a user's partial table stays partial.
---@return BlackAtom.Config
function M.resolve()
    return vim.tbl_deep_extend("force", M.defaults, vim.g.black_atom_core_config or {})
end

return M
