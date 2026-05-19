import os
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.callbacks import EvalCallback, CheckpointCallback
from utils.rl_env import ObstaclePlacementEnv


# ------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------
GRID_SIZE = 16                     # 256 actions
MAX_OBSTACLES = 5
ENEMY_SPEED = 30.0
TRAIN_TIMESTEPS = 200_000

BOUNDS = (49.18, 11.67, 49.42, 11.98)
ENEMY_START = (49.30, 11.85)
OBJECTIVE = (49.28, 11.92)

# ------------------------------------------------------------
# ENVIRONMENT FACTORY
# ------------------------------------------------------------
def make_env():
    env = ObstaclePlacementEnv(
        bounds=BOUNDS,
        enemy_start=ENEMY_START,
        objective=OBJECTIVE,
        enemy_speed=ENEMY_SPEED,
        max_obstacles=MAX_OBSTACLES,
        grid_size=GRID_SIZE
        
    )
    return Monitor(env)

# ------------------------------------------------------------
# VECTORIZED ENVIRONMENTS
# ------------------------------------------------------------
train_env = DummyVecEnv([make_env])
eval_env = DummyVecEnv([make_env])

# ------------------------------------------------------------
# CALLBACKS
# ------------------------------------------------------------
os.makedirs("./models", exist_ok=True)
os.makedirs("./logs", exist_ok=True)
 
checkpoint_callback = CheckpointCallback(
    save_freq=10_000,
    save_path="./models/",
    name_prefix="rl_obstacle"
)

eval_callback = EvalCallback(
    eval_env,
    best_model_save_path="./models/best/",
    log_path="./logs/",
    eval_freq=5_000,
    deterministic=True
)

# ------------------------------------------------------------
# MODEL
# ------------------------------------------------------------
model = PPO(
    "MlpPolicy",
    train_env,
    verbose=1,
    learning_rate=1e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2,
    ent_coef=0.05,
    vf_coef=0.5,
    max_grad_norm=0.5,
    policy_kwargs=dict(net_arch=[64, 64])
)

# ------------------------------------------------------------
# TRAIN
# ------------------------------------------------------------
print("🚀 Starting training...")
model.learn(
    total_timesteps=TRAIN_TIMESTEPS,
    callback=[checkpoint_callback, eval_callback]
)
model.save("models/final_model")
print("✅ Training complete.")