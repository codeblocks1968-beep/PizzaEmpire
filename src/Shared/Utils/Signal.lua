-- A simple Signal module for Roblox
local Signal = {}
Signal.__index = Signal

function Signal.new()
	local self = setmetatable({}, Signal)
	self._connections = {}
	return self
end

function Signal:Connect(callback)
	local connection = {
		Callback = callback,
		Connected = true,
		Disconnect = function(conn)
			conn.Connected = false
			for i, v in ipairs(self._connections) do
				if v == conn then
					table.remove(self._connections, i)
					break
				end
			end
		end
	}
	table.insert(self._connections, connection)
	return connection
end

function Signal:Fire(...)
	for _, connection in ipairs(self._connections) do
		if connection.Connected then
			task.spawn(connection.Callback, ...)
		end
	end
end

function Signal:Wait()
	local thread = coroutine.running()
	local connection
	connection = self:Connect(function(...)
		connection:Disconnect()
		task.spawn(thread, ...)
	end)
	return coroutine.yield()
end

return Signal
