---@doc https://github.com/black-atom-industries/radar.nvim
---@type BlackAtom.HighlightsSpec
return {
    enabled = true,
    map = function(colors, config)
        local ui = colors.ui
        local bg = require("black-atom.lib.bg")

        ---@type BlackAtom.Highlights
        return {
            RadarHud = { fg = ui.fg.default, bg = bg.float(config, colors) },
        }
    end,
}
