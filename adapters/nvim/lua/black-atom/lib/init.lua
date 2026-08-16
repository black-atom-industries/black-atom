---@class BlackAtom.Lib
local M = {}

-- Lazy-load modules on access
setmetatable(M, {
    __index = function(t, k)
        local modules = {
            ui = "black-atom.lib.ui",
            highlights = "black-atom.lib.highlights",
            bg = "black-atom.lib.bg",
            lsp_kinds = "black-atom.lib.lsp_kinds",
        }

        if modules[k] then
            local module = require(modules[k])
            rawset(t, k, module)
            return module
        end
    end,
})

return M
