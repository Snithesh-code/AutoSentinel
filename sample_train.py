# train_primaite_marl_full_quiet.py
import os
import glob
import yaml
import time
import math
import logging
from collections import defaultdict, deque

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.rllib.algorithms.callbacks import DefaultCallbacks

# Put strong logging suppression BEFORE importing/creating environments/workers
# (some libraries configure logging eagerly, so force override)
os.environ["PYTHONWARNINGS"] = "ignore"  # optional: hide python warnings

# Force a basic config and set root level to WARNING
logging.basicConfig(level=logging.WARNING, force=True)
logging.getLogger().setLevel(logging.WARNING)

# Quiet known noisy loggers and attach NullHandler (defensive)
noisy_loggers = [
    "primaite.session.environment",
    "primaite.session",
    "client_1_green_user_log",
    "client_2_green_user_log",
    "ray",
    "ray.rllib",
    "urllib3",           # sometimes verbose
    "requests",          # sometimes verbose
]
for name in noisy_loggers:
    lg = logging.getLogger(name)
    lg.setLevel(logging.WARNING)
    lg.propagate = False
    # replace handlers with a NullHandler so nothing is emitted
    try:
        lg.handlers = [logging.NullHandler()]
    except Exception:
        pass

# Primaite import - after we've set logging
from primaite.session.ray_envs import PrimaiteRayMARLEnv

# ----------------------------
# USER CONFIG
# ----------------------------
YAML_PATH = "/content/v3.yaml"        # path to your primaite YAML
NUM_TRAIN_ITERS = 100                 # total training iterations
LOCAL_MODE = True                     # True for debugging / single-process
PRINT_AGG_EVERY = 10                  # print aggregated stats every N episodes
TRAIN_BATCH_SIZE = 4000
LOCAL_DIR = "./ray_results"
CHECKPOINT_DIR = os.path.join(LOCAL_DIR, "checkpoints")
CKPT_EVERY = 10                       # save checkpoint every N iterations
RESUME_FROM = None                    # set to a specific checkpoint path to force resume
# ----------------------------

# ----------------------------
# Robust EpisodeSummaryCallbacks
# ----------------------------
class EpisodeSummaryCallbacks(DefaultCallbacks):
    def __init__(self):
        super().__init__()
        self.recent_episode_rewards = deque(maxlen=1000)
        self.recent_episode_lengths = deque(maxlen=1000)
        self.per_policy_rewards = defaultdict(list)
        self.episode_counter = 0
        self.print_agg_every = PRINT_AGG_EVERY

    def _safe_episode_length(self, episode):
        try:
            if hasattr(episode, "length"):
                if callable(episode.length):
                    return int(episode.length())
                else:
                    return int(episode.length)
            if hasattr(episode, "last_info") and isinstance(episode.last_info, dict):
                return int(episode.last_info.get("length", 0))
        except Exception:
            pass
        return 0

    def _collect_agent_rewards(self, episode):
        agent_reward_map = {}
        try:
            if hasattr(episode, "agent_rewards") and isinstance(episode.agent_rewards, dict):
                for aid, rew in episode.agent_rewards.items():
                    try:
                        agent_reward_map[aid] = float(rew)
                    except Exception:
                        agent_reward_map[aid] = rew

            if not agent_reward_map and hasattr(episode, "_agent_to_rewards"):
                try:
                    for aid, rews in episode._agent_to_rewards.items():
                        agent_reward_map[aid] = float(sum(rews))
                except Exception:
                    pass

            if not agent_reward_map and hasattr(episode, "_agent_to_total_reward"):
                try:
                    agent_reward_map = dict(episode._agent_to_total_reward)
                except Exception:
                    pass

            if not agent_reward_map and hasattr(episode, "total_reward"):
                try:
                    agent_reward_map["all_agents"] = float(episode.total_reward)
                except Exception:
                    pass

        except Exception:
            agent_reward_map = {}

        if not agent_reward_map and hasattr(episode, "custom_metrics"):
            try:
                for k, v in episode.custom_metrics.items():
                    try:
                        agent_reward_map[k] = float(v)
                    except Exception:
                        pass
            except Exception:
                pass

        return agent_reward_map

    def on_episode_end(self, *, worker, base_env, policies, episode, **kwargs):
        self.episode_counter += 1

        agent_reward_map = self._collect_agent_rewards(episode)
        total_episode_reward = float(sum(agent_reward_map.values())) if agent_reward_map else float(getattr(episode, "total_reward", 0.0))
        episode_length = self._safe_episode_length(episode)

        policy_rewards = defaultdict(list)
        for agent_id, rew in agent_reward_map.items():
            policy_id = str(agent_id).split("_")[0]
            policy_rewards[policy_id].append(rew)

        policy_means = {p: (sum(vals) / len(vals) if vals else 0.0) for p, vals in policy_rewards.items()}

        self.recent_episode_rewards.append(total_episode_reward)
        self.recent_episode_lengths.append(episode_length)
        for p, vals in policy_means.items():
            self.per_policy_rewards[p].append(vals)

        policy_str = " ".join([f"{p}={policy_means[p]:.3f}" for p in sorted(policy_means.keys())])
        # Single-line episode summary (this is the only frequent print)
        print(f"Ep {self.episode_counter:4d} | len={episode_length:3d} | total_reward={total_episode_reward:7.3f} | {policy_str}")

        # Periodic aggregate print
        if (self.episode_counter % self.print_agg_every) == 0:
            window_rewards = list(self.recent_episode_rewards)
            n = len(window_rewards)
            if n:
                mean_r = sum(window_rewards) / n
                std_r = math.sqrt(sum((x - mean_r) ** 2 for x in window_rewards) / n)
            else:
                mean_r = std_r = 0.0

            per_policy_agg = {}
            for p, arr in self.per_policy_rewards.items():
                if arr:
                    mean_p = sum(arr[-100:]) / min(len(arr), 100)
                else:
                    mean_p = 0.0
                per_policy_agg[p] = mean_p

            per_policy_str = " ".join([f"{p}_mean={per_policy_agg[p]:.3f}" for p in sorted(per_policy_agg.keys())])
            print(f"--- AGG Ep {self.episode_counter} over last {len(window_rewards)} eps: total_mean={mean_r:.3f} total_std={std_r:.3f} | {per_policy_str} ---")

# ----------------------------
# Utility: latest checkpoint finder
# ----------------------------
def find_latest_checkpoint(ckpt_dir):
    if not os.path.isdir(ckpt_dir):
        return None
    candidates = glob.glob(os.path.join(ckpt_dir, "checkpoint_*"))
    if candidates:
        return max(candidates, key=os.path.getmtime)
    all_files = []
    for root, _, files in os.walk(ckpt_dir):
        for f in files:
            all_files.append(os.path.join(root, f))
    if not all_files:
        return None
    return max(all_files, key=os.path.getmtime)

# ----------------------------
# Main training
# ----------------------------
def main():
    assert os.path.exists(YAML_PATH), f"YAML file not found at {YAML_PATH}"
    with open(YAML_PATH, "r") as fh:
        env_cfg = yaml.safe_load(fh)

    # Ray init
    ray.shutdown()
    ray.init(local_mode=LOCAL_MODE, include_dashboard=False)

    # Build PPO multi-agent config
    config = (
        PPOConfig()
        .environment(env=PrimaiteRayMARLEnv, env_config=env_cfg)
        .framework(framework="torch")
        .multi_agent(
            policies={
                "attacker": (None, None, None, {}),
                "defender": (None, None, None, {}),
            },
            policy_mapping_fn=lambda agent_id, episode, worker, **kw: str(agent_id).split("_")[0],
        )
        .training(train_batch_size=TRAIN_BATCH_SIZE)
        .rollouts(num_rollout_workers=0)
        .callbacks(EpisodeSummaryCallbacks)
        .reporting(min_time_s_per_iteration=0.0)
        .resources(num_gpus=0)
    )

    algo = config.build()

    # Ensure checkpoint dir
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)

    # Attempt resume
    restored_ckpt = None
    try:
        if RESUME_FROM:
            if os.path.exists(RESUME_FROM):
                print(f"Restoring from explicit checkpoint: {RESUME_FROM}")
                algo.restore(RESUME_FROM)
                restored_ckpt = RESUME_FROM
            else:
                print(f"RESUME_FROM path set but not found: {RESUME_FROM}")
        else:
            latest = find_latest_checkpoint(CHECKPOINT_DIR)
            if latest:
                try:
                    print(f"Auto-restoring from latest checkpoint: {latest}")
                    algo.restore(latest)
                    restored_ckpt = latest
                except Exception as e:
                    print(f"Warning: failed to restore from {latest} ({e}). Continuing from scratch.")
            else:
                print("No checkpoint found. Starting training from scratch.")
    except Exception as e:
        print(f"Warning during restore attempt: {e}. Continuing from scratch.")

    print(f"Checkpoints will be saved to: {CHECKPOINT_DIR}")

    # Training loop
    print("--- Starting Training ---")
    for it in range(1, NUM_TRAIN_ITERS + 1):
        results = algo.train()

        train_time = results.get("time_this_iter_s", 0.0)
        episodes_this_iter = results.get("episodes_this_iter", None) or results.get("num_episodes_sampler", None) or results.get("episodes_total", None)
        mean_ep_len = results.get("episode_len_mean", None)
        policy_reward_mean = results.get("policy_reward_mean", {})

        policy_parts = []
        if isinstance(policy_reward_mean, dict):
            for pid, val in policy_reward_mean.items():
                policy_parts.append(f"{pid}={val:.3f}")
        policy_str = " ".join(policy_parts) if policy_parts else "no-policy-rewards"

        print(f"Iter {it:3d} | it_s={train_time:.2f} | eps={episodes_this_iter} | ep_len_mean={mean_ep_len} | {policy_str}")

        # periodic checkpoint
        if (it % CKPT_EVERY) == 0:
            try:
                ckpt = algo.save(checkpoint_dir=CHECKPOINT_DIR)
                print(f"Saved checkpoint at iter {it} -> {ckpt}")
            except Exception as e:
                print(f"Warning: failed to save checkpoint at iter {it}: {e}")

    # final checkpoint
    try:
        final_ckpt = algo.save(checkpoint_dir=CHECKPOINT_DIR)
        print(f"Training finished. Final checkpoint: {final_ckpt}")
    except Exception as e:
        print(f"Warning: failed to save final checkpoint: {e}")

    # Evaluation (optional)
    try:
        eval_results = algo.evaluate()
        print("Evaluation summary:", eval_results.get("evaluation", eval_results))
    except Exception as e:
        print(f"Warning: evaluation failed: {e}")

    # Cleanup
    algo.stop()
    ray.shutdown()

if __name__ == "__main__":
    main()
