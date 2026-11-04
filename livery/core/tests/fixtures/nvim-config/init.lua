-- vim.g.black_atom_core_config = { styles = { dark_gutter = true } }
vim.opt.number = true
local theme = vim.g.black_atom_core_config
vim.g.black_atom_core_config = { styles = { dark_gutter = true } }
if vim.g.black_atom_core_config == nil then return end
vim.g["black_atom_core_config"] = vim.tbl_deep_extend("force", {}, {})
vim.cmd.colorscheme(item.text)
vim.cmd("colorscheme " .. name)
vim.api.nvim_set_hl(0, "Normal", {})
-- vim.cmd.colorscheme("commented")
vim.cmd.colorscheme("black-atom-jpn-koyo-dark")
vim.cmd("colorscheme black-atom-jpn-koyo-dark")
vim.cmd.colorscheme "black-atom-jpn-koyo-dark"
vim.cmd([[colorscheme black-atom-jpn-koyo-dark]])
vim.cmd([[
  colorscheme black-atom-jpn-koyo-dark
]])
