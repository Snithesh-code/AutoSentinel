import os
import yaml
import ray
import time

# ======================================================
# === ENVIRONMENT & CHECKPOINT CONFIG ===
# ======================================================
YAML_PATH = "v3.yaml"                       # Path to Primaite YAML
CHECKPOINT_DIR = "ray_results/checkpoints"  # Path to folder containing algo_state.pkl
MAX_STEPS = 50                              # Rollout length per episode

# === Optimize imports: disable TensorFlow, CUDA checks ===
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["RLLIB_FRAMEWORK"] = "torch"
os.environ["RLLIB_TEST_NO_TF_IMPORT"] = "1"

# ======================================================
# === LOAD PRETRAINED CHECKPOINT ===
# ======================================================
def load_pretrained_checkpoint():
    print("🔄 Initializing Ray...")
    ray.shutdown()
    ray.init(ignore_reinit_error=True, include_dashboard=False, log_to_driver=True)
    print("✅ Ray initialized")

    # Load Primaite environment config
    with open(YAML_PATH, "r") as f:
        env_cfg = yaml.safe_load(f)

    print(f"🔁 Restoring from checkpoint: {CHECKPOINT_DIR}")
    from ray.rllib.algorithms.algorithm import Algorithm
    algo = Algorithm.from_checkpoint(CHECKPOINT_DIR)
    print("✅ Successfully restored pretrained model.")

    return algo, env_cfg


# ======================================================
# === MANUAL EVALUATION LOOP ===
# ======================================================
def run_rollout(algo, env_cfg, max_steps=MAX_STEPS):
    print("\n🎬 Starting manual rollout...\n")

    # Lazy import Primaite environment to avoid heavy init earlier
    from primaite.session.ray_envs import PrimaiteRayMARLEnv

    env = PrimaiteRayMARLEnv(env_cfg)
    obs = env.reset()
    if isinstance(obs, tuple):  # handle gymnasium reset
        obs = obs[0]

    total_rewards = {"attacker": 0.0, "defender": 0.0}

    for step in range(max_steps):
        actions = {}
        for agent_id, ob in obs.items():
            policy_id = str(agent_id).split("_")[0]
            actions[agent_id] = algo.compute_single_action(ob, policy_id=policy_id)

        step_result = env.step(actions)

        # handle gym / gymnasium differences
        if len(step_result) == 4:
            obs, rewards, dones, infos = step_result
        elif len(step_result) == 5:
            obs, rewards, terminateds, truncateds, infos = step_result
            dones = {aid: (terminateds.get(aid, False) or truncateds.get(aid, False))
                     for aid in terminateds.keys()}
            dones["__all__"] = terminateds.get("__all__", False) or truncateds.get("__all__", False)
        else:
            raise ValueError(f"Unexpected env.step() format ({len(step_result)} elements)")

        # Accumulate rewards
        for agent_id, r in rewards.items():
            role = str(agent_id).split("_")[0]
            total_rewards[role] += r

        # Print per-step summary
        print(f"\nStep {step+1:03d}")
        for agent_id in actions.keys():
            print(f"  {agent_id:12s} | action: {actions[agent_id]} | reward: {rewards.get(agent_id, 0)}")

        if dones.get("__all__"):
            print("\n✅ Episode finished early.")
            break

    env.close()
    print("\n🏁 Rollout complete.")
    print(f"Total rewards: {total_rewards}")


# ======================================================
# === MAIN ENTRY POINT ===
# ======================================================
if __name__ == "__main__":
    t0 = time.time()
    algo, env_cfg = load_pretrained_checkpoint()
    run_rollout(algo, env_cfg)
    print(f"\n⏱️ Total runtime: {round(time.time() - t0, 2)}s")
