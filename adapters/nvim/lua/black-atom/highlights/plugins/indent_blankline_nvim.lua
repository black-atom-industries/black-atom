---@doc https://github.com/lukas-reineke/indent-blankline.nvim
---@type BlackAtom.HighlightsSpec
return {
    enabled = false,
    map = function(colors)
        local ui = colors.ui

        ---@type BlackAtom.Highlights
        return {
            IndentBlanklineChar = { fg = ui.fg.border },
            IndentBlanklineContextChar = { fg = ui.fg.subtle },
        }
    end,
}
