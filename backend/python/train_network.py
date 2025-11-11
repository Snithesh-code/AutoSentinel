#!/usr/bin/env python3
"""
PrimAITE Network Training Script for AutoSentinel v2
Uses Ray RLlib with PPO for multi-agent reinforcement learning
"""
import os
import sys
import argparse
import yaml
import json
import logging
from datetime import datetime
from pathlib import Path

# === Ensure unbuffered output for real-time logging ===
sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None
sys.stderr.reconfigure(line_buffering=True) if hasattr(sys.stderr, 'reconfigure') else None

# === Configure environment for GPU training ===
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["RLLIB_FRAMEWORK"] = "torch"
os.environ["RLLIB_TEST_NO_TF_IMPORT"] = "1"
os.environ["PYTHONWARNINGS"] = "ignore"
os.environ["PYTHONUNBUFFERED"] = "1"  # Force unbuffered output
# Enable CUDA for GPU training (comment out to use CPU only)
# os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Uncomment this line to force CPU

import ray
from ray.rllib.algorithms.ppo import PPOConfig
from ray.rllib.algorithms.dqn import DQNConfig
from ray.rllib.algorithms.callbacks import DefaultCallbacks

# Logging setup - suppress all warnings
logging.basicConfig(level=logging.ERROR, force=True)
logging.getLogger().setLevel(logging.ERROR)

# Quiet noisy loggers
noisy_loggers = [
    "primaite.session.environment",
    "primaite.session",
    "primaite",
    "ray",
    "ray.rllib",
    "ray.tune",
    "ray.train",
    "urllib3",
    "requests",
    "tensorflow",
    "tensorboard",
]
for name in noisy_loggers:
    lg = logging.getLogger(name)
    lg.setLevel(logging.ERROR)
    lg.propagate = False
    try:
        lg.handlers = [logging.NullHandler()]
    except Exception:
        pass

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# Import PrimAITE environment
try:
    from primaite.session.ray_envs import PrimaiteRayMARLEnv
except ImportError:
    print("ERROR: PrimAITE not found. Please install PrimAITE first.")
    sys.exit(1)


# Global callback instance to track episodes across iterations
_global_callbacks = None

class TrainingCallbacks(DefaultCallbacks):
    """Callbacks for tracking training progress and logging"""

    def __init__(self):
        super().__init__()
        self.episode_counter = 0
        self.episode_rewards = []
        self.last_reported_episode = 0
        self.iteration_counter = 0
        self.policy_rewards = {}  # Track per-policy rewards: {policy_name: [rewards]}

        # Store globally so we can access from main loop
        global _global_callbacks
        _global_callbacks = self

    def on_episode_end(self, *, worker, base_env, policies, episode, **kwargs):
        self.episode_counter += 1

        # Get episode info
        episode_length = 0
        total_reward = 0.0

        try:
            if hasattr(episode, "length"):
                episode_length = int(episode.length() if callable(episode.length) else episode.length)
            if hasattr(episode, "total_reward"):
                total_reward = float(episode.total_reward)
        except Exception:
            pass

        # Track reward history
        self.episode_rewards.append(total_reward)

        # Extract per-agent rewards to track by policy
        policy_rewards_this_episode = {}
        try:
            if hasattr(episode, "agent_rewards") and isinstance(episode.agent_rewards, dict):
                for agent_id, agent_reward in episode.agent_rewards.items():
                    # Extract policy name from agent_id
                    # agent_id can be a string like "attacker_0" or tuple like ('attacker', 'attacker')
                    if isinstance(agent_id, tuple):
                        # Tuple format: ('attacker', 'attacker') -> use first element
                        policy_name = agent_id[0]
                    else:
                        # String format: "attacker_0" -> extract first part before underscore
                        policy_name = str(agent_id).split("_")[0]

                    policy_name = str(policy_name).strip()
                    if policy_name not in policy_rewards_this_episode:
                        policy_rewards_this_episode[policy_name] = []
                    policy_rewards_this_episode[policy_name].append(float(agent_reward))

                    # Also track in history for training loop
                    if policy_name not in self.policy_rewards:
                        self.policy_rewards[policy_name] = []
                    self.policy_rewards[policy_name].append(float(agent_reward))
        except Exception as e:
            pass

        # Calculate mean reward per policy for this episode
        policy_means = {}
        for policy_name, rewards in policy_rewards_this_episode.items():
            if rewards:
                policy_means[policy_name] = sum(rewards) / len(rewards)

        # Print structured metric (parseable by frontend)
        # Format: METRIC|episode=X|length=Y|reward=Z|attacker=A|defender=D
        policy_str = "|".join([f"{p}={r:.3f}" for p, r in sorted(policy_means.items())])
        metric_line = f"METRIC|episode={self.episode_counter}|length={episode_length}|reward={total_reward:.3f}"
        if policy_str:
            metric_line += f"|{policy_str}"
        print(metric_line, flush=True)



def load_yaml_config(yaml_path):
    """Load and parse YAML configuration"""
    if not os.path.exists(yaml_path):
        raise FileNotFoundError(f"YAML file not found: {yaml_path}")

    with open(yaml_path, 'r') as f:
        return yaml.safe_load(f)


def extract_policies_from_config(env_config):
    """Extract policy definitions from environment config

    Only proxy-agents get explicit policies. Other agent types (probabilistic, random, etc.)
    are not trained and don't need policy specs.
    Ray will use these policies and create_missing_policies=True for env discovery.
    """
    policies = {}

    # Get agents from config
    agents = env_config.get('agents', [])

    # Only add policies for proxy-agents
    for agent in agents:
        agent_type = agent.get('type', '')

        # Only proxy-agents need policies for training
        if agent_type == 'proxy-agent':
            ref = agent.get('ref', '')
            # Extract policy name (first part before underscore)
            # Example: "attacker_1" -> "attacker", or just "attacker" -> "attacker"
            policy_name = ref.split('_')[0] if '_' in ref else ref

            if policy_name and policy_name not in policies:
                # Add policy with None spaces - Ray will infer from environment
                policies[policy_name] = (None, None, None, {})

    return policies


def policy_mapping_fn(agent_id, episode=None, worker=None, **kwargs):
    """Map agent ID to policy - extract first part before underscore"""
    # Example: "green_user" -> "green", "attacker_1" -> "attacker"
    return str(agent_id).split("_")[0]


def train(args):
    """Main training function"""

    print(f"\n{'='*60}")
    print("AutoSentinel v2 - PrimAITE Training")
    print(f"{'='*60}\n")

    # Load YAML configuration
    print(f"Loading configuration from: {args.config}")
    env_config = load_yaml_config(args.config)

    # Extract policies from config
    policies = extract_policies_from_config(env_config)
    print(f"Detected policies: {list(policies.keys())}")

    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_dir = output_dir / "checkpoints"
    checkpoint_dir.mkdir(exist_ok=True)

    print(f"Output directory: {output_dir}")
    print(f"Checkpoint directory: {checkpoint_dir}")

    # Initialize Ray
    print("\nInitializing Ray...")
    ray.shutdown()
    ray.init(local_mode=args.local_mode, include_dashboard=False)

    # Select algorithm
    print(f"Algorithm: {args.algorithm}")
    if args.algorithm.upper() == 'PPO':
        config_builder = PPOConfig()
    elif args.algorithm.upper() == 'DQN':
        config_builder = DQNConfig()
    else:
        print(f"Unknown algorithm: {args.algorithm}, defaulting to PPO")
        config_builder = PPOConfig()
    print(policies)
    # Build training configuration
    # Disable preprocessor to avoid NoneType errors with observation space inference
    config = (
        config_builder
        .environment(env=PrimaiteRayMARLEnv, env_config=env_config)
        .framework(framework="torch")
        .multi_agent(
            
            policies=policies,
            policy_mapping_fn=policy_mapping_fn # Auto-create policies from environment
        )
        .training(train_batch_size=4000)
        .rollouts(num_rollout_workers=0)
        .callbacks(TrainingCallbacks)
        .reporting(min_time_s_per_iteration=0.0)
        .resources(num_gpus=1)  # Use 1 GPU for training
        .debugging(log_level="WARNING")
    )

    # Disable preprocessor for all policies to avoid shape inference errors
    # Must be set BEFORE build()
    config.model["_disable_preprocessor_api"] = True
    config.model["_disable_action_flattening"] = True

    # Build algorithm
    print("Building algorithm...")
    algo = config.build()

    # Training metadata
    training_metadata = {
        'start_time': datetime.now().isoformat(),
        'config_file': args.config,
        'algorithm': args.algorithm,
        'episodes': args.episodes,
        'save_frequency': args.save_frequency,
        'policies': list(policies.keys()),
    }

    # Save metadata
    metadata_path = output_dir / "training_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(training_metadata, f, indent=2)

    # Training loop
    print(f"\n{'='*60}")
    print(f"Starting Training - {args.episodes} episodes")
    print(f"{'='*60}\n")

    try:
        iteration = 0
        total_episodes = 0

        while total_episodes < args.episodes:
            iteration += 1

            # Train one iteration
            results = algo.train()

            # Use the global callback counter for accurate episode tracking
            if _global_callbacks:
                total_episodes = _global_callbacks.episode_counter
            else:
                # Fallback to RLlib metrics if callback not available
                total_episodes = results.get("episodes_this_iter", 0)

            train_time = results.get("time_this_iter_s", 0.0)
            mean_ep_len = results.get("episode_len_mean", 0)

            # Get policy rewards from callback
            policy_rewards = {}
            if _global_callbacks and _global_callbacks.policy_rewards:
                # Calculate average reward for each policy in this iteration
                # Get the number of episodes from this iteration
                episodes_this_iter = total_episodes - (iteration - 1) * (total_episodes // max(1, iteration))

                for policy_id, rewards in _global_callbacks.policy_rewards.items():
                    if rewards:
                        # Use mean of recent rewards (last N from this iteration)
                        recent_rewards = rewards[-10:] if len(rewards) > 10 else rewards
                        policy_rewards[policy_id] = sum(recent_rewards) / len(recent_rewards)

            # Extract individual policy rewards for printing
            attacker_reward = policy_rewards.get('attacker', 0.0)
            defender_reward = policy_rewards.get('defender', 0.0)

            print(f"ITERATION|iter={iteration}|episodes={total_episodes}/{args.episodes}|time={train_time:.2f}s|mean_len={mean_ep_len}|RED_attacker={attacker_reward:.3f}|BLUE_defender={defender_reward:.3f}", flush=True)

            # Save checkpoint periodically
            if iteration % args.save_frequency == 0:
                try:
                    checkpoint_path = algo.save(checkpoint_dir=str(checkpoint_dir))
                    print(f"[OK] Checkpoint saved: {checkpoint_path}")
                except Exception as e:
                    print(f"[FAILED] Failed to save checkpoint: {e}")

        # Save final checkpoint
        print("\n" + "="*60)
        print("Training Complete!")
        print("="*60)

        try:
            final_checkpoint = algo.save(checkpoint_dir=str(checkpoint_dir))
            print(f"[OK] Final checkpoint saved: {final_checkpoint}")

            # Update metadata
            training_metadata['end_time'] = datetime.now().isoformat()
            training_metadata['status'] = 'completed'
            training_metadata['final_checkpoint'] = str(final_checkpoint)
            training_metadata['total_iterations'] = iteration
            training_metadata['total_episodes'] = total_episodes

            with open(metadata_path, 'w') as f:
                json.dump(training_metadata, f, indent=2)

        except Exception as e:
            print(f"[FAILED] Failed to save final checkpoint: {e}")
            training_metadata['status'] = 'failed'
            training_metadata['error'] = str(e)

    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user")
        training_metadata['status'] = 'interrupted'
        with open(metadata_path, 'w') as f:
            json.dump(training_metadata, f, indent=2)

    except Exception as e:
        print(f"\n[ERROR] Training failed: {e}")
        training_metadata['status'] = 'error'
        training_metadata['error'] = str(e)
        with open(metadata_path, 'w') as f:
            json.dump(training_metadata, f, indent=2)
        raise

    finally:
        # Cleanup
        print("\nCleaning up...")
        algo.stop()
        ray.shutdown()
        print("Done!")


def main():
    parser = argparse.ArgumentParser(description='Train PrimAITE network with Ray RLlib')
    parser.add_argument('--config', required=True, help='Path to YAML configuration file')
    parser.add_argument('--output', required=True, help='Output directory for checkpoints and logs')
    parser.add_argument('--episodes', type=int, default=1000, help='Number of training episodes')
    parser.add_argument('--save-frequency', type=int, default=10, help='Save checkpoint every N iterations')
    parser.add_argument('--algorithm', default='PPO', choices=['PPO', 'DQN'], help='RL algorithm')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')
    parser.add_argument('--local-mode', action='store_true', help='Run Ray in local mode (for debugging)')

    args = parser.parse_args()

    try:
        train(args)
    except Exception as e:
        import traceback
        print(f"\nFatal error: {e}", file=sys.stderr)
        print("\nFull traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
