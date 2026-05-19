import gymnasium as gym
import numpy as np
import heapq

class ObstaclePlacementEnv(gym.Env):
    """
    RL environment where agent places obstacles to increase enemy path cost.
    Dense reward = reduction in path cost after each placement.
    """

    def __init__(
        self,
        *,
        bounds,               # (south, west, north, east) – not used directly here, but kept for compatibility
        enemy_start,
        objective,
        enemy_speed,
        max_obstacles,
        grid_size
    ):
        super().__init__()
        self.bounds = bounds
        self.enemy_start = enemy_start
        self.objective = objective
        self.enemy_speed = enemy_speed
        self.max_obstacles = max_obstacles
        self.grid_size = grid_size

        # Convert enemy start and objective to grid indices
        south, west, north, east = bounds
        lat_span = north - south
        lng_span = east - west
        self.lat_to_idx = lambda lat: int((lat - south) / lat_span * grid_size)
        self.lng_to_idx = lambda lng: int((lng - west) / lng_span * grid_size)
        self.start_idx = (self.lat_to_idx(enemy_start[0]), self.lng_to_idx(enemy_start[1]))
        self.goal_idx = (self.lat_to_idx(objective[0]), self.lng_to_idx(objective[1]))

        # Observation: flat grid (obstacle map)
        self.observation_space = gym.spaces.Box(
            low=0.0, high=1.0,
            shape=(grid_size * grid_size,),
            dtype=np.float32
        )
        # Action: choose a cell (0 .. grid_size^2 - 1)
        self.action_space = gym.spaces.Discrete(grid_size * grid_size)

        self.state = None          # 2D obstacle grid
        self.steps = 0
        self.prev_path_cost = None

    # ----------------------------------------------------------
    # A* pathfinding on uniform grid (cost = 1 per cell)
    # ----------------------------------------------------------
    def _least_cost_path(self, obstacles_grid):
        """
        obstacles_grid: 2D array, 0 = free, 1 = obstacle.
        Returns number of steps in shortest path (or a large number if unreachable).
        """
        rows, cols = obstacles_grid.shape
        start = self.start_idx
        goal = self.goal_idx

        # If start or goal is blocked, return large cost
        if obstacles_grid[start[0], start[1]] == 1 or obstacles_grid[goal[0], goal[1]] == 1:
            return 1e6

        dist = np.full((rows, cols), np.inf)
        dist[start[0], start[1]] = 0
        pq = [(0, start)]
        while pq:
            d, (r, c) = heapq.heappop(pq)
            if (r, c) == goal:
                break
            if d > dist[r, c]:
                continue
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr, nc = r+dr, c+dc
                if 0 <= nr < rows and 0 <= nc < cols and obstacles_grid[nr, nc] == 0:
                    nd = d + 1
                    if nd < dist[nr, nc]:
                        dist[nr, nc] = nd
                        heapq.heappush(pq, (nd, (nr, nc)))
        return dist[goal[0], goal[1]]

    # ----------------------------------------------------------
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.state = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        self.steps = 0
        # Compute initial path cost (no obstacles)
        self.prev_path_cost = self._least_cost_path(self.state)
        return self._get_obs(), {}

    # ----------------------------------------------------------
    def step(self, action):
        row = action // self.grid_size
        col = action % self.grid_size

        # Penalty for invalid placement (cell already occupied)
        if self.state[row, col] == 1.0:
            reward = -1.0
            terminated = False
            truncated = False
            return self._get_obs(), reward, terminated, truncated, {}

        # Place obstacle
        self.state[row, col] = 1.0
        self.steps += 1

        # Compute new path cost
        new_cost = self._least_cost_path(self.state)
        # Dense reward: improvement in path cost (negative reward if cost increased? Actually we want cost to increase, so positive reward for making cost larger)
        # reward = (new_cost - self.prev_path_cost) * scaling
        reward = (new_cost - self.prev_path_cost) * 0.1
        self.prev_path_cost = new_cost

        # Terminal condition
        terminated = (self.steps >= self.max_obstacles)
        if terminated:
            # Bonus if the path is completely blocked (cost > large threshold)
            if new_cost > 1e5:
                reward += 10.0
            else:
                # Small penalty for not blocking
                reward -= 0.5

        truncated = False
        return self._get_obs(), reward, terminated, truncated, {}

    # ----------------------------------------------------------
    def _get_obs(self):
        return self.state.reshape(-1).astype(np.float32)