local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local VFXUtil = require(ReplicatedStorage.Shared.Utils.VFXUtil)

local HUDController = {}
local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local MainHUD = nil

function HUDController.UpdateCash(amount)
	if not MainHUD then return end
	local cashLabel = MainHUD:FindFirstChild("CashLabel", true)
	if cashLabel then
		cashLabel.Text = "$" .. HUDController.FormatNumber(amount)
		VFXUtil.PopUI(cashLabel)
	end
end

function HUDController.FormatNumber(num)
	-- Simple comma formatting
	local formatted = tostring(num)
	while true do  
		formatted, k = string.gsub(formatted, "^(-?%d+)(%d%d%d)", '%1,%2')
		if (k==0) then break end
	end
	return formatted
end

function HUDController.Init()
	MainHUD = PlayerGui:WaitForChild("MainHUD")
	-- Initial update
	-- In a real game, you'd listen to data changes from server
end

return HUDController
