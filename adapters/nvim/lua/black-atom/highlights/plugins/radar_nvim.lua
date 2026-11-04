---@doc https://github.com/black-atom-industries/radar.nvim
---@type BlackAtom.HighlightsSpec
return {
    enabled = true,
    map = function(colors)
        local ui = colors.ui

        ---@type BlackAtom.Highlights
        return {
            RadarHud = { fg = ui.fg.default, bg = ui.bg.panel },
        }
    end,
}
