local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CollectionService = game:GetService("CollectionService")
local DataManager = require(script.Parent.DataManager)
local Upgrades = require(ReplicatedStorage.Shared.Config.Upgrades)
local Constants = require(ReplicatedStorage.Shared.Constants)

local TycoonHandler = {}
local Plots = {} -- { [PlotInstance] = Player }

function TycoonHandler.ClaimPlot(player, plot)
	if Plots[plot] then return false end
	
	-- Check if player already has a plot
	for p, owner in pairs(Plots) do
		if owner == player then return false end
	end
	
	Plots[plot] = player
	TycoonHandler.InitTycoon(player, plot)
	return true
end

function TycoonHandler.InitTycoon(player, plot)
	local data = DataManager.Get(player)
	if not data then return end
	
	-- Spawn purchased items
	for _, unlockName in ipairs(data.Unlocks) do
		TycoonHandler.SpawnItem(plot, unlockName)
	end
	
	-- Setup purchase buttons
	TycoonHandler.RefreshButtons(player, plot)
end

function TycoonHandler.SpawnItem(plot, itemName)
	-- In a real game, you'd load a model from ServerStorage
	-- and parent it to plot.Items
	print("Spawning " .. itemName .. " for plot " .. plot.Name)
end

function TycoonHandler.PurchaseItem(player, itemName)
	local data = DataManager.Get(player)
	local upgrade = Upgrades[itemName]
	
	if not upgrade then return false end
	if data.Cash < upgrade.Cost then return false end
	
	-- Check prerequisites
	if upgrade.Prerequisite then
		local hasPrereq = false
		for _, unlock in ipairs(data.Unlocks) do
			if unlock == upgrade.Prerequisite then
				hasPrereq = true
				break
			end
		end
		if not hasPrereq then return false end
	end
	
	-- Process purchase
	data.Cash -= upgrade.Cost
	table.insert(data.Unlocks, itemName)
	
	-- Find player's plot
	for plot, owner in pairs(Plots) do
		if owner == player then
			TycoonHandler.SpawnItem(plot, itemName)
			TycoonHandler.RefreshButtons(player, plot)
			break
		end
	end
	
	return true
end

function TycoonHandler.RefreshButtons(player, plot)
	-- Update visibility of purchase buttons based on what the player can afford/buy next
end

function TycoonHandler.Init()
	-- Listen for purchase remote events
	local purchaseRemote = Instance.new("RemoteFunction")
	purchaseRemote.Name = "PurchaseItem"
	purchaseRemote.Parent = ReplicatedStorage
	
	purchaseRemote.OnServerInvoke = function(player, itemName)
		return TycoonHandler.PurchaseItem(player, itemName)
	end
end

return TycoonHandler
