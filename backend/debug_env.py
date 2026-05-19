from utils.rl_env import ObstaclePlacementEnv
import numpy as np

env = ObstaclePlacementEnv(
    bounds=(49.18, 11.67, 49.42, 11.98),
    enemy_start=(49.30, 11.85),
    objective=(49.28, 11.92),
    max_obstacles=5,
    grid_size=32
)

obs, _ = env.reset()
print("Obs shape:", obs.shape)
print("Obs dtype:", obs.dtype)
print("Obs min:", np.min(obs))
print("Obs max:", np.max(obs))
print("Obs mean:", np.mean(obs))
outside = np.any((obs < 0) | (obs > 1))
print("Any outside [0,1]:", outside)
print("Space contains:", env.observation_space.contains(obs))