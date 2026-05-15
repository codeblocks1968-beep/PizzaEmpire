local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Recipes = require(ReplicatedStorage.Shared.Config.Recipes)
local Constants = require(ReplicatedStorage.Shared.Constants)

local CustomerService = {}
local Customers = {}

function CustomerService.SpawnCustomer(plot)
	-- 1. Create NPC model (Low poly)
	-- 2. Select a random recipe they want
	local recipeNames = {}
	for name, _ in pairs(Recipes) do table.insert(recipeNames, name) end
	local wantedPizza = recipeNames[math.random(#recipeNames)]
	
	-- 3. Set target position (The counter in the plot)
	local counter = plot:FindFirstChild("Counter")
	if not counter then return end
	
	print("Customer spawned at plot " .. plot.Name .. " wanting " .. wantedPizza)
	
	-- Simple AI: Move to counter, wait, then leave
	-- In a real implementation, you'd use Humanoid:MoveTo()
end

function CustomerService.HandleOrder(player, customer, pizzaObject)
	-- Check if pizza matches what customer wants
	-- Award cash based on recipe price
end

function CustomerService.Init()
	-- Loop to spawn customers for active plots
	task.spawn(function()
		while true do
			task.wait(Constants.CUSTOMER_SPAWN_RATE)
			-- Logic to check active plots and spawn if under limit
		end
	end)
end

return CustomerService
