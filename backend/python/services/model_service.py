import os
import yaml
import logging
import time
from typing import Dict, Any, Optional

# === Optimize imports: disable TensorFlow, CUDA checks ===
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["RLLIB_FRAMEWORK"] = "torch"
os.environ["RLLIB_TEST_NO_TF_IMPORT"] = "1"

logger = logging.getLogger(__name__)

class ModelService:
    """Service for loading and running the trained RL model"""

    def __init__(self, model_path: str, config_path: str):
        self.model_path = model_path
        self.config_path = config_path
        self.algo = None
        self.env_config = None
        self._loaded = False

    async def initialize(self):
        """Initialize the model service - optimized for faster loading"""
        try:
            start_total = time.time()
            logger.info("🔧 Initializing Model Service...")

            # Check if model checkpoint exists first
            checkpoint_file = os.path.join(self.model_path, "algorithm_state.pkl")
            if not os.path.exists(checkpoint_file):
                logger.warning(f"⚠️  Model checkpoint not found at {checkpoint_file}")
                logger.info("ℹ️  Running in mock mode with random policy")
                self._loaded = False
                return

            # Load environment config
            start_config = time.time()
            if not os.path.exists(self.config_path):
                logger.error(f"❌ Config file not found: {self.config_path}")
                self._loaded = False
                return

            with open(self.config_path, 'r') as f:
                self.env_config = yaml.safe_load(f)
            config_time = time.time() - start_config
            logger.info(f"✅ Loaded environment configuration ({config_time:.2f}s)")

            # Lazy import Ray and PyTorch (speeds up initial load)
            start_imports = time.time()
            import ray
            from ray.rllib.algorithms.ppo import PPOConfig
            import torch
            imports_time = time.time() - start_imports
            logger.info(f"⚡ Imported dependencies ({imports_time:.2f}s)")

            # Optimize PyTorch for inference only
            torch.set_grad_enabled(False)  # Disable gradients for faster inference
            if hasattr(torch, 'set_num_threads'):
                torch.set_num_threads(2)  # Limit threads to reduce overhead
            logger.info("⚡ PyTorch optimized for inference")

            # Check if GPU is available
            start_gpu = time.time()
            gpu_available = torch.cuda.is_available()
            if gpu_available:
                gpu_name = torch.cuda.get_device_name(0)
                logger.info(f"🎮 GPU detected: {gpu_name}")
            else:
                logger.info("💻 Running on CPU (no GPU detected)")
            gpu_time = time.time() - start_gpu
            logger.info(f"⚡ GPU detection ({gpu_time:.3f}s)")

            # Initialize Ray - following testing.py pattern
            start_ray = time.time()
            if ray.is_initialized():
                ray.shutdown()
                logger.info("🔄 Ray was running, shut it down")

            ray.init(
                local_mode=True,  # CPU-friendly mode
                include_dashboard=False,
                ignore_reinit_error=True,
                num_cpus=1,  # Limit CPU cores for better performance
                log_to_driver=False,  # Reduce logging overhead
                _temp_dir=None,  # Use default temp directory
            )
            ray_time = time.time() - start_ray
            logger.info(f"✅ Ray initialized ({ray_time:.2f}s)")

            # Import Primaite environment
            try:
                start_env = time.time()
                from primaite.session.ray_envs import PrimaiteRayMARLEnv
                env_time = time.time() - start_env
                logger.info(f"⚡ Imported Primaite environment ({env_time:.2f}s)")

                # Configure GPU for model
                num_gpus = 1 if gpu_available else 0
                if num_gpus > 0:
                    logger.info("🎮 Configuring model to use GPU")
                else:
                    logger.info("💻 Configuring model for CPU")

                # Build PPO configuration - exactly like testing.py
                start_config_build = time.time()
                config = (
                    PPOConfig()
                    .environment(env=PrimaiteRayMARLEnv, env_config=self.env_config)
                    .framework("torch")
                    .multi_agent(
                        policies={
                            "attacker": (None, None, None, {}),
                            "defender": (None, None, None, {}),
                        },
                        policy_mapping_fn=lambda agent_id, *a, **kw: str(agent_id).split("_")[0],
                    )
                    .resources(num_gpus=num_gpus)  # Use GPU if available
                )
                config_build_time = time.time() - start_config_build
                logger.info(f"⚡ Built PPO configuration ({config_build_time:.2f}s)")

                # Build algorithm
                start_algo = time.time()
                logger.info("🔨 Building PPO algorithm...")
                self.algo = config.build()
                algo_time = time.time() - start_algo
                logger.info(f"✅ PPO algorithm built ({algo_time:.2f}s)")

                # Restore checkpoint - optimized loading
                start_restore = time.time()
                logger.info(f"🔁 Restoring from checkpoint: {self.model_path}")

                # Set device for faster loading
                if gpu_available:
                    device = "cuda:0"
                else:
                    device = "cpu"

                # Restore checkpoint
                self.algo.restore(self.model_path)
                restore_time = time.time() - start_restore
                logger.info(f"✅ Successfully restored pretrained PPO model ({restore_time:.2f}s)")

                # Set model to evaluation mode for faster inference
                try:
                    if hasattr(self.algo, 'workers'):
                        # Try new API first (single worker)
                        if hasattr(self.algo.workers, 'local_worker'):
                            worker = self.algo.workers.local_worker()
                            for policy in worker.policy_map.values():
                                if hasattr(policy, 'model'):
                                    policy.model.eval()
                        # Fallback to old API (multiple workers)
                        elif hasattr(self.algo.workers, 'local_workers'):
                            for worker in self.algo.workers.local_workers():
                                for policy in worker.policy_map.values():
                                    if hasattr(policy, 'model'):
                                        policy.model.eval()
                    logger.info("⚡ Model set to evaluation mode")
                except Exception as e:
                    logger.warning(f"⚠️  Could not set model to eval mode: {e}")

                self._loaded = True

                # Print total time breakdown
                total_time = time.time() - start_total
                logger.info("=" * 60)
                logger.info("⏱️  MODEL LOADING TIME BREAKDOWN:")
                logger.info(f"  Config loading:     {config_time:.2f}s")
                logger.info(f"  Dependencies:       {imports_time:.2f}s")
                logger.info(f"  GPU detection:      {gpu_time:.3f}s")
                logger.info(f"  Ray initialization: {ray_time:.2f}s")
                logger.info(f"  Primaite import:    {env_time:.2f}s")
                logger.info(f"  PPO config build:   {config_build_time:.2f}s")
                logger.info(f"  Algorithm build:    {algo_time:.2f}s")
                logger.info(f"  Checkpoint restore: {restore_time:.2f}s")
                logger.info(f"  TOTAL TIME:         {total_time:.2f}s")
                logger.info("=" * 60)

            except ImportError as e:
                logger.warning(f"⚠️  Primaite not available: {e}")
                logger.info("ℹ️  Running in mock mode")
                self._loaded = False

        except Exception as e:
            logger.error(f"❌ Error initializing model service: {str(e)}")
            logger.exception(e)
            self._loaded = False

    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self._loaded

    async def predict(self, observations: Dict[str, Any]) -> Dict[str, int]:
        """Get actions from the model for given observations"""
        if not self._loaded or self.algo is None:
            # Return random actions if model not loaded
            logger.debug("🎲 Using random actions (model not loaded)")
            return {
                "attacker": 0,  # do-nothing action
                "defender": 0   # do-nothing action
            }

        try:
            actions = {}
            logger.debug(f"🤖 Computing actions for {len(observations)} agents...")

            for agent_id, obs in observations.items():
                policy_id = str(agent_id).split("_")[0]
                action = self.algo.compute_single_action(obs, policy_id=policy_id)
                actions[agent_id] = action
                logger.debug(f"  {agent_id} ({policy_id}) → action: {action}")

            logger.debug(f"✅ Actions computed: {actions}")
            return actions

        except Exception as e:
            logger.error(f"❌ Error during prediction: {str(e)}")
            return {
                "attacker": 0,
                "defender": 0
            }

    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "loaded": self._loaded,
            "model_path": self.model_path,
            "config_path": self.config_path,
            "policies": ["attacker", "defender"] if self._loaded else []
        }

    def __del__(self):
        """Cleanup resources"""
        if self.algo:
            try:
                self.algo.stop()
            except:
                pass
