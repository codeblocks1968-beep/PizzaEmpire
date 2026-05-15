local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Constants = require(ReplicatedStorage.Shared.Constants)

local InteractionHandler = {}

local INTERACTION_TAGS = {
	DOUGH_STATION = "DoughStation",
	TOPPING_STATION = "ToppingStation",
	OVEN = "Oven",
	BOXING_STATION = "BoxingStation"
}

function InteractionHandler.HandleDoughStation(player, station)
	print(player.Name .. " is making dough at " .. station.Name)
	-- Logic to give player a 'Raw Pizza' object
end

function InteractionHandler.HandleOven(player, oven)
	-- Logic to start cooking a pizza
end

function InteractionHandler.Init()
	-- Instead of a loop, we can use ProximityPrompts or a custom distance check
	-- For optimization, we'll use ProximityPrompts added to tagged objects
	
	local function onStationAdded(station)
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Interact"
		prompt.ObjectText = station.Name
		prompt.MaxActivationDistance = Constants.INTERACTION_DISTANCE
		prompt.Parent = station
		
		prompt.Triggered:Connect(function(player)
			if CollectionService:HasTag(station, INTERACTION_TAGS.DOUGH_STATION) then
				InteractionHandler.HandleDoughStation(player, station)
			elseif CollectionService:HasTag(station, INTERACTION_TAGS.OVEN) then
				InteractionHandler.HandleOven(player, station)
			end
		end)
	end
	
	-- Connect existing and new tagged objects
	for _, tag in pairs(INTERACTION_TAGS) do
		CollectionService:GetInstanceAddedSignal(tag):Connect(onStationAdded)
		for _, instance in ipairs(CollectionService:GetTagged(tag)) do
			onStationAdded(instance)
		end
	end
end

return InteractionHandler
