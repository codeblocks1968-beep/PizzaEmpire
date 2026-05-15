local Constants = {
	TYCOON_MAX_PLOTS = 6,
	STARTING_CASH = 100,
	DATA_KEY = "PizzaEmpire_V1",
	
	-- Interaction Distances
	INTERACTION_DISTANCE = 10,
	
	-- Customer Settings
	MAX_CUSTOMERS_PER_PLOT = 5,
	CUSTOMER_SPAWN_RATE = 15, -- seconds
	
	-- Pizza States
	PIZZA_STATES = {
		RAW = "Raw",
		TOPPED = "Topped",
		COOKING = "Cooking",
		COOKED = "Cooked",
		BOXED = "Boxed",
		SERVED = "Served"
	}
}

return Constants
