local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local Constants = require(game:GetService("ReplicatedStorage").Shared.Constants)

local DataManager = {}
local PlayerData = {}

local DB = DataStoreService:GetDataStore(Constants.DATA_KEY)

local DEFAULT_DATA = {
	Cash = Constants.STARTING_CASH,
	Gems = 0,
	Unlocks = {"BasicCounter"},
	Rebirths = 0,
	PlayTime = 0
}

function DataManager.Get(player)
	return PlayerData[player]
end

function DataManager.Update(player, key, value)
	if PlayerData[player] then
		PlayerData[player][key] = value
		-- Fire a remote event to update client UI if needed
	end
end

local function loadData(player)
	local success, data = pcall(function()
		return DB:GetAsync(tostring(player.UserId))
	end)
	
	if success and data then
		PlayerData[player] = data
	else
		PlayerData[player] = table.clone(DEFAULT_DATA)
	end
end

local function saveData(player)
	if PlayerData[player] then
		local success, err = pcall(function()
			DB:SetAsync(tostring(player.UserId), PlayerData[player])
		end)
		if not success then
			warn("Failed to save data for " .. player.Name .. ": " .. err)
		end
	end
end

function DataManager.Init()
	Players.PlayerAdded:Connect(loadData)
	Players.PlayerRemoving:Connect(function(player)
		saveData(player)
		PlayerData[player] = nil
	end)
	
	-- Auto-save loop
	task.spawn(function()
		while true do
			task.wait(300) -- 5 minutes
			for _, player in ipairs(Players:GetPlayers()) do
				saveData(player)
			end
		end
	end)
end

return DataManager
