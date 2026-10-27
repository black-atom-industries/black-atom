---@doc https://github.com/black-atom-industries/iter.nvim
---@type BlackAtom.HighlightsSpec
return {
    map = function(colors)
        local ui = colors.ui

        -- The drawer is a float: without a background it shows the windows beneath it.
        ---@type BlackAtom.Highlights
        return {
            IterDrawer = { fg = ui.fg.default, bg = ui.bg.panel },
        }
    end,
}
