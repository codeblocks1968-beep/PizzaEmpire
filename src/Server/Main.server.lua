local DataManager = require(script.Parent.DataManager)
local TycoonHandler = require(script.Parent.TycoonHandler)
local CustomerService = require(script.Parent.CustomerService)
local InteractionHandler = require(script.Parent.InteractionHandler)

-- Initialize all services
print("[SERVER] Initializing Pizza Empire Tycoon...")

DataManager.Init()
TycoonHandler.Init()
CustomerService.Init()
InteractionHandler.Init()

print("[SERVER] All services initialized successfully.")
