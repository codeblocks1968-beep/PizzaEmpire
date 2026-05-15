local Upgrades = {
	-- Stage 1: Basic Kitchen
	["BasicCounter"] = {
		Cost = 0, -- Starting item
		Description = "The foundation of your pizza empire.",
		Stage = 1
	},
	["BasicOven"] = {
		Cost = 100,
		Description = "Cooks pizzas slowly but surely.",
		Stage = 1,
		Prerequisite = "BasicCounter"
	},
	["FirstWorker"] = {
		Cost = 250,
		Description = "Hires an NPC to help prep dough.",
		Stage = 1,
		Prerequisite = "BasicOven"
	},
	
	-- Stage 2: Expansion
	["ProOven"] = {
		Cost = 1000,
		Description = "Heats up 50% faster.",
		Stage = 2,
		Prerequisite = "FirstWorker"
	},
	["DriveThru"] = {
		Cost = 2500,
		Description = "Allows cars to order pizzas!",
		Stage = 2,
		Prerequisite = "ProOven"
	},
	
	-- Stage 3: Elite
	["EliteChef"] = {
		Cost = 10000,
		Description = "A master chef who never burns a pizza.",
		Stage = 3,
		Prerequisite = "DriveThru"
	}
}

return Upgrades
