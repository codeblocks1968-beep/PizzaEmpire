local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local VFXUtil = {}

function VFXUtil.PopUI(guiObject)
	local originalSize = guiObject.Size
	local popSize = UDim2.fromScale(originalSize.X.Scale * 1.2, originalSize.Y.Scale * 1.2)
	
	local tweenIn = TweenService:Create(guiObject, TweenInfo.new(0.1, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Size = popSize})
	local tweenOut = TweenService:Create(guiObject, TweenInfo.new(0.1), {Size = originalSize})
	
	tweenIn:Play()
	tweenIn.Completed:Connect(function()
		tweenOut:Play()
	end)
end

function VFXUtil.CreateFloatingText(position, text, color)
	-- This would usually be handled on the client
	-- In a real game, you'd fire a remote to all clients to show this
end

function VFXUtil.PlayLocalSound(soundId, parent, volume)
	local sound = Instance.new("Sound")
	sound.SoundId = "rbxassetid://" .. tostring(soundId)
	sound.Volume = volume or 0.5
	sound.Parent = parent or game:GetService("SoundService")
	sound:Play()
	Debris:AddItem(sound, 3)
end

return VFXUtil
