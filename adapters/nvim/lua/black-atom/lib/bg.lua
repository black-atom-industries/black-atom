local cond_hl = require("black-atom.lib.highlights").cond_hl

local M = {}

---@param config BlackAtom.Config
---@param colors BlackAtom.Theme.Colors
---@return string
function M.default(config, colors)
    return cond_hl(colors.ui.bg.default, {
        [config.transparency == "partial"] = colors.none,
        [config.transparency == "full"] = colors.none,
    })
end

---@param config BlackAtom.Config
---@param colors BlackAtom.Theme.Colors
---@return string
function M.panel(config, colors)
    return cond_hl(colors.ui.bg.panel, {
        [not config.dark_sidebars] = colors.ui.bg.default,
        [config.dark_sidebars and config.transparency == "partial"] = colors.ui.bg.panel,
        [config.transparency == "full"] = colors.none,
    })
end

---@param config BlackAtom.Config
---@param colors BlackAtom.Theme.Colors
---@return string
function M.float(config, colors)
    return cond_hl(colors.ui.bg.panel, {
        [not config.dark_floats] = colors.ui.bg.default,
        [config.dark_floats and config.transparency == "partial"] = colors.ui.bg.panel,
        [config.transparency == "full"] = colors.none,
    })
end

---@param config BlackAtom.Config
---@param colors BlackAtom.Theme.Colors
---@return string
function M.gutter(config, colors)
    return cond_hl(colors.ui.bg.panel, {
        [not config.dark_gutter] = M.default(config, colors),
        [config.dark_gutter and config.transparency == "full"] = colors.none,
    })
end

return M
