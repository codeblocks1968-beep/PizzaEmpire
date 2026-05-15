local Recipes = {
	["Pepperoni"] = {
		Ingredients = {"Dough", "Sauce", "Cheese", "Pepperoni"},
		CookTime = 10,
		BasePrice = 50,
		Difficulty = 1
	},
	["Margherita"] = {
		Ingredients = {"Dough", "Sauce", "Cheese", "Basil"},
		CookTime = 8,
		BasePrice = 40,
		Difficulty = 1
	},
	["Hawaiian"] = {
		Ingredients = {"Dough", "Sauce", "Cheese", "Ham", "Pineapple"},
		CookTime = 12,
		BasePrice = 65,
		Difficulty = 2
	},
	["MeatLovers"] = {
		Ingredients = {"Dough", "Sauce", "Cheese", "Pepperoni", "Sausage", "Bacon"},
		CookTime = 15,
		BasePrice = 80,
		Difficulty = 3
	}
}

return Recipes
