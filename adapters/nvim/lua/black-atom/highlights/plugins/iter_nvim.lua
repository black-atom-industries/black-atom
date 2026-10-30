---@doc https://github.com/black-atom-industries/iter.nvim
---@type BlackAtom.HighlightsSpec
return {
    enabled = true,
    map = function(colors)
        local ui = colors.ui
        local syntax = colors.syntax

        ---Mixes `amount` of `color` into `base`.
        ---@param color string
        ---@param base string
        ---@param amount number
        ---@return string
        local function blend(color, base, amount)
            local function channel(hex, i)
                return tonumber(hex:sub(i, i + 1), 16)
            end
            local out = "#"
            for _, i in ipairs({ 2, 4, 6 }) do
                local value = channel(color, i) * amount + channel(base, i) * (1 - amount)
                out = out .. string.format("%02x", math.floor(value + 0.5))
            end
            return out
        end

        -- Rows are blended against bg.default rather than Normal, so they stay
        -- lighter than the gutter under a transparent Normal too. The gutter takes
        -- some of the git color on top of the tint, with default text for contrast.
        ---@type BlackAtom.Highlights
        return {
            IterDiffAdd = { bg = blend(ui.bg.add, ui.bg.default, 0.6) },
            IterDiffDelete = { bg = blend(ui.bg.delete, ui.bg.default, 0.6) },
            IterDiffAddText = { bg = blend(ui.fg.add, ui.bg.add, 0.12) },
            IterDiffDeleteText = { bg = blend(ui.fg.delete, ui.bg.delete, 0.12) },
            IterDiffAddNr = { fg = ui.fg.default, bg = blend(ui.fg.add, ui.bg.add, 0.12) },
            IterDiffDeleteNr = { fg = ui.fg.default, bg = blend(ui.fg.delete, ui.bg.delete, 0.12) },
            IterCommitSha = { fg = ui.fg.accent },
            IterCommitAuthor = { fg = syntax.string.default },
            IterCommitDate = { fg = syntax.comment.default },
            IterCommitBody = { fg = ui.fg.subtle },
        }
    end,
}
