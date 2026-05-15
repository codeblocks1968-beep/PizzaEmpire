local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Upgrades = require(ReplicatedStorage.Shared.Config.Upgrades)
local PurchaseRemote = ReplicatedStorage:WaitForChild("PurchaseItem")

local UpgradeController = {}

function UpgradeController.OpenMenu()
	-- Code to make the upgrade menu visible
end

function UpgradeController.TryPurchase(itemName)
	local success = PurchaseRemote:InvokeServer(itemName)
	if success then
		print("Successfully purchased " .. itemName)
		-- Play success sound/VFX
	else
		warn("Failed to purchase " .. itemName)
		-- Play error sound/VFX
	end
end

function UpgradeController.Init()
	-- Connect button clicks in the UI to TryPurchase
end

return UpgradeController
