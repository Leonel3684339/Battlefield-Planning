from utils.rl_env import ObstaclePlacementEnv
from stable_baselines3.common.env_checker import check_env

env = ObstaclePlacementEnv(
    bounds=(49.18, 11.67, 49.42, 11.98),
    enemy_start=(49.30, 11.85),
    objective=(49.28, 11.92),
    max_obstacles=5,
    grid_size=32
)

print("Observation space shape:", env.observation_space.shape)
check_env(env)