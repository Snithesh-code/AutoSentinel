import asyncio
import logging
from typing import Dict, Any, List, Optional
import yaml

logger = logging.getLogger(__name__)

# ANSI color codes for console output
class Colors:
    RED = '\033[91m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class SimulationService:
    """Service for managing the cybersecurity simulation"""

    def __init__(self, model_service, config_path: str):
        self.model_service = model_service
        self.config_path = config_path
        self.env = None
        self.env_config = None
        self._running = False
        self._step_count = 0
        self._episode_count = 0
        self.current_obs = None
        self.agent_rewards = {"attacker": 0.0, "defender": 0.0}
        self.last_actions = {"attacker": None, "defender": None}
        self.last_action_ids = {"attacker": 0, "defender": 0}
        self._auto_step_task = None
        self.step_delay = 2.0  # Delay between automatic steps in seconds

    async def initialize(self):
        """Initialize the simulation service"""
        try:
            logger.info("🎮 Initializing Simulation Service...")

            # Load config (lightweight operation)
            with open(self.config_path, 'r') as f:
                self.env_config = yaml.safe_load(f)

            # Try to create environment (optional, lazy)
            try:
                from primaite.session.ray_envs import PrimaiteRayMARLEnv
                self.env = PrimaiteRayMARLEnv(self.env_config)
                logger.info("✅ Primaite environment created")

                # Reset environment
                reset_result = self.env.reset()
                self.current_obs = reset_result[0] if isinstance(reset_result, tuple) else reset_result

            except ImportError:
                logger.info("ℹ️  Primaite not available - running in mock mode")
                self.env = None
            except Exception as e:
                logger.warning(f"⚠️  Could not create environment: {str(e)}")
                logger.info("ℹ️  Running in mock mode")
                self.env = None

            logger.info("✅ Simulation service initialized")

        except Exception as e:
            logger.error(f"❌ Error initializing simulation: {str(e)}")
            # Don't crash, just use mock mode
            self.env = None
            logger.info("ℹ️  Continuing in mock mode")

    def is_running(self) -> bool:
        """Check if simulation is running"""
        return self._running

    async def start(self):
        """Start continuous simulation"""
        if self._running:
            logger.warning("⚠️  Simulation already running")
            return

        self._running = True
        logger.info("▶️  Simulation started")
        logger.info(f"📊 Episode {self._episode_count}, Step {self._step_count}")
        logger.info(f"🎯 Current rewards - {Colors.RED}Attacker: {self.agent_rewards['attacker']:.2f}{Colors.RESET}, {Colors.BLUE}Defender: {self.agent_rewards['defender']:.2f}{Colors.RESET}")

        # Start the auto-step loop
        self._auto_step_task = asyncio.create_task(self._auto_step_loop())
        logger.info("🔄 Auto-step loop started")

    async def stop(self):
        """Stop simulation"""
        self._running = False

        # Cancel the auto-step loop
        if self._auto_step_task and not self._auto_step_task.done():
            self._auto_step_task.cancel()
            try:
                await self._auto_step_task
            except asyncio.CancelledError:
                pass

        logger.info("⏸️  Simulation stopped")
        logger.info(f"📊 Final state - Episode {self._episode_count}, Step {self._step_count}")
        logger.info(f"🏆 Final rewards - {Colors.RED}Attacker: {self.agent_rewards['attacker']:.2f}{Colors.RESET}, {Colors.BLUE}Defender: {self.agent_rewards['defender']:.2f}{Colors.RESET}")

    async def reset(self):
        """Reset simulation"""
        logger.info("🔄 Resetting simulation...")
        self._running = False
        self._step_count = 0
        self._episode_count += 1
        self.agent_rewards = {"attacker": 0.0, "defender": 0.0}
        self.last_actions = {"attacker": None, "defender": None}
        self.last_action_ids = {"attacker": 0, "defender": 0}
        logger.info(f"✅ Reset complete - Starting Episode {self._episode_count}")

        if self.env:
            try:
                reset_result = self.env.reset()
                self.current_obs = reset_result[0] if isinstance(reset_result, tuple) else reset_result
                logger.info("🔄 Simulation reset")
            except Exception as e:
                logger.error(f"Error resetting environment: {str(e)}")
        else:
            # Mock reset
            self.current_obs = self._generate_mock_obs()
            logger.info("🔄 Simulation reset (mock mode)")

    async def _auto_step_loop(self):
        """Continuously step through the simulation while running"""
        logger.info("🔄 Auto-step loop running...")
        try:
            while self._running:
                # Execute a step
                await self.step()

                # Wait before next step
                await asyncio.sleep(self.step_delay)
        except asyncio.CancelledError:
            logger.info("🛑 Auto-step loop cancelled")
        except Exception as e:
            logger.error(f"❌ Error in auto-step loop: {str(e)}")
            self._running = False

    async def step(self) -> Dict[str, Any]:
        """Execute one simulation step"""
        self._step_count += 1

        logger.info("=" * 60)
        logger.info(f"🎮 STEP {self._step_count} | Episode {self._episode_count}")
        logger.info("=" * 60)

        events = []
        node_states = {}

        if self.env and self.current_obs:
            try:
                logger.info(f"📥 Getting actions from {'model' if self.model_service.is_loaded() else 'mock mode'}...")

                # Get actions from model
                actions = await self.model_service.predict(self.current_obs)
                logger.info(f"🎯 Actions: {actions}")

                # Store and decode actions for each agent
                for agent_id, action_id in actions.items():
                    role = str(agent_id).split("_")[0]
                    # Convert to int to avoid numpy types
                    action_id_int = int(action_id)
                    action_name = self._get_action_name(role, action_id_int)
                    self.last_actions[role] = action_name
                    self.last_action_ids[role] = action_id_int

                    # Color code based on agent type
                    if role == "attacker":
                        color = Colors.RED
                    elif role == "defender":
                        color = Colors.BLUE
                    else:
                        color = Colors.GREEN

                    logger.info(f"{color}  {agent_id} ({role}) → {action_name} (action {action_id_int}){Colors.RESET}")

                # Step environment
                logger.info("⚙️  Executing environment step...")
                step_result = self.env.step(actions)

                # Handle both gym and gymnasium formats
                if len(step_result) == 4:
                    obs, rewards, dones, infos = step_result
                elif len(step_result) == 5:
                    obs, rewards, terminateds, truncateds, infos = step_result
                    dones = {aid: (terminateds.get(aid, False) or truncateds.get(aid, False))
                            for aid in terminateds.keys()}
                else:
                    raise ValueError(f"Unexpected step result format")

                self.current_obs = obs

                # Update rewards
                logger.info("💰 Processing rewards:")
                for agent_id, reward in rewards.items():
                    role = str(agent_id).split("_")[0]
                    if role in self.agent_rewards:
                        old_reward = self.agent_rewards[role]
                        # Convert to float to avoid numpy types
                        reward_float = float(reward)
                        self.agent_rewards[role] += reward_float

                        # Color code based on agent type
                        if role == "attacker":
                            color = Colors.RED
                        elif role == "defender":
                            color = Colors.BLUE
                        else:
                            color = Colors.GREEN

                        logger.info(f"{color}  {agent_id}: {old_reward:.2f} + {reward_float:.2f} = {self.agent_rewards[role]:.2f}{Colors.RESET}")

                # Generate events from actions
                logger.info("📋 Generating events:")
                for agent_id, action in actions.items():
                    role = str(agent_id).split("_")[0]
                    action_name = self._get_action_name(role, action)
                    severity = self._determine_severity(action_name)

                    # Color code based on agent type
                    if role == "attacker":
                        color = Colors.RED
                    elif role == "defender":
                        color = Colors.BLUE
                    else:
                        color = Colors.GREEN

                    logger.info(f"{color}  {agent_id} → {action_name} (severity: {severity}){Colors.RESET}")

                    events.append({
                        "type": "attack" if role == "attacker" else "defense",
                        "agent": agent_id,
                        "action": action_name,
                        "severity": severity,
                        "description": f"{agent_id} executed {action_name}"
                    })

                # Check if episode ended
                if dones.get("__all__", False):
                    logger.info("🏁 Episode ended!")
                    logger.info(f"📊 Final episode rewards - {Colors.RED}Attacker: {self.agent_rewards['attacker']:.2f}{Colors.RESET}, {Colors.BLUE}Defender: {self.agent_rewards['defender']:.2f}{Colors.RESET}")
                    await self.reset()
                    events.append({
                        "type": "system",
                        "agent": "system",
                        "action": "episode_end",
                        "severity": "low",
                        "description": "Episode ended, starting new episode"
                    })

                logger.info(f"✅ Step {self._step_count} complete")
                logger.info(f"🎯 Cumulative rewards - {Colors.RED}Attacker: {self.agent_rewards['attacker']:.2f}{Colors.RESET}, {Colors.BLUE}Defender: {self.agent_rewards['defender']:.2f}{Colors.RESET}")
                logger.info("")

            except Exception as e:
                logger.error(f"Error during step: {str(e)}")
                # Fallback to mock step
                return await self._mock_step()
        else:
            # Mock step
            return await self._mock_step()

        return {
            "step": int(self._step_count),
            "agents": {
                "attacker": {
                    "reward": float(self.agent_rewards["attacker"]),
                    "action": self.last_actions.get("attacker")
                },
                "defender": {
                    "reward": float(self.agent_rewards["defender"]),
                    "action": self.last_actions.get("defender")
                }
            },
            "events": events,
            "node_states": node_states
        }

    async def _mock_step(self) -> Dict[str, Any]:
        """Execute a mock simulation step for testing without Primaite"""
        import random

        logger.info("🎲 Running in MOCK MODE (Primaite not available)")

        # Mock actions
        attacker_action = random.randint(0, 3)
        defender_action = random.randint(0, 5)

        # Decode and store actions
        attacker_action_name = self._get_action_name("attacker", attacker_action)
        defender_action_name = self._get_action_name("defender", defender_action)

        self.last_actions["attacker"] = attacker_action_name
        self.last_actions["defender"] = defender_action_name
        self.last_action_ids["attacker"] = attacker_action
        self.last_action_ids["defender"] = defender_action

        logger.info(f"🎯 Mock actions:")
        logger.info(f"{Colors.RED}  Attacker: {attacker_action_name} (action {attacker_action}){Colors.RESET}")
        logger.info(f"{Colors.BLUE}  Defender: {defender_action_name} (action {defender_action}){Colors.RESET}")

        # Mock rewards
        attacker_reward = random.uniform(-0.5, 1.0)
        defender_reward = random.uniform(-0.5, 1.0)

        old_attacker = self.agent_rewards["attacker"]
        old_defender = self.agent_rewards["defender"]

        self.agent_rewards["attacker"] += attacker_reward
        self.agent_rewards["defender"] += defender_reward

        logger.info(f"💰 Mock rewards:")
        logger.info(f"{Colors.RED}  Attacker: {old_attacker:.2f} + {attacker_reward:.2f} = {self.agent_rewards['attacker']:.2f}{Colors.RESET}")
        logger.info(f"{Colors.BLUE}  Defender: {old_defender:.2f} + {defender_reward:.2f} = {self.agent_rewards['defender']:.2f}{Colors.RESET}")

        # Generate mock events
        events = [
            {
                "type": "attack",
                "agent": "attacker_0",
                "action": attacker_action_name,
                "severity": random.choice(["low", "medium", "high"]),
                "description": f"Attacker executed {attacker_action_name}"
            },
            {
                "type": "defense",
                "agent": "defender_0",
                "action": defender_action_name,
                "severity": "low",
                "description": f"Defender executed {defender_action_name}"
            }
        ]

        return {
            "step": int(self._step_count),
            "agents": {
                "attacker": {
                    "reward": float(self.agent_rewards["attacker"]),
                    "action": attacker_action_name
                },
                "defender": {
                    "reward": float(self.agent_rewards["defender"]),
                    "action": defender_action_name
                }
            },
            "events": events,
            "node_states": {}
        }

    def _generate_mock_obs(self) -> Dict[str, Any]:
        """Generate mock observations"""
        import numpy as np
        return {
            "attacker_0": np.zeros(100),
            "defender_0": np.zeros(100)
        }

    def _get_action_name(self, agent_type: str, action_id: int) -> str:
        """Get human-readable action name - extracted from v3.yaml"""
        if agent_type == "attacker":
            action_names = {
                0: "do-nothing",
                1: "data-manipulation-bot (client_1)",
                2: "dos-bot (client_1)",
                3: "ransomware-script (client_1)",
                4: "data-manipulation-bot (client_2)",
                5: "dos-bot (client_2)",
                6: "ransomware-script (client_2)",
                7: "remote-command [cat /etc/passwd]",
                8: "configure-ransomware (client_1)",
                9: "configure-c2-beacon (client_1)",
                10: "configure-database-client (client_1)",
                11: "configure-dos-bot (client_1)",
                12: "c2-server-ransomware-launch",
                13: "c2-server-terminal-command",
                14: "c2-server-data-exfiltrate",
                15: "c2-server-ransomware-configure",
                16: "corrupt-file (database.db)",
            }
        else:  # defender - all 84 actions from v3.yaml
            action_names = {
                0: "do-nothing",
                1: "scan-service (web_server)",
                2: "stop-service (web_server)",
                3: "start-service (web_server)",
                4: "pause-service (web_server)",
                5: "resume-service (web_server)",
                6: "restart-service (web_server)",
                7: "disable-service (web_server)",
                8: "enable-service (web_server)",
                9: "scan-file (database.db)",
                10: "scan-file (database.db)",
                11: "delete-file (database.db)",
                12: "repair-file (database.db)",
                13: "fix-service (database_server)",
                14: "scan-folder (database)",
                15: "scan-folder (database)",
                16: "repair-folder (database)",
                17: "restore-folder (database)",
                18: "scan-os (domain_controller)",
                19: "shutdown (domain_controller)",
                20: "startup (domain_controller)",
                21: "reset (domain_controller)",
                22: "scan-os (web_server)",
                23: "shutdown (web_server)",
                24: "startup (web_server)",
                25: "reset (web_server)",
                26: "scan-os (database_server)",
                27: "shutdown (database_server)",
                28: "startup (database_server)",
                29: "reset (database_server)",
                30: "scan-os (backup_server)",
                31: "shutdown (backup_server)",
                32: "startup (backup_server)",
                33: "reset (backup_server)",
                34: "scan-os (security_suite)",
                35: "shutdown (security_suite)",
                36: "startup (security_suite)",
                37: "reset (security_suite)",
                38: "scan-os (client_1)",
                39: "shutdown (client_1)",
                40: "startup (client_1)",
                41: "reset (client_1)",
                42: "scan-os (client_2)",
                43: "shutdown (client_2)",
                44: "startup (client_2)",
                45: "reset (client_2)",
                46: "add-acl-rule [pos0]",
                47: "add-acl-rule [pos1]",
                48: "add-acl-rule [pos2]",
                49: "add-acl-rule [pos3]",
                50: "add-acl-rule [pos4]",
                51: "add-acl-rule [pos5]",
                52: "remove-acl-rule [pos0]",
                53: "remove-acl-rule [pos1]",
                54: "remove-acl-rule [pos2]",
                55: "remove-acl-rule [pos3]",
                56: "remove-acl-rule [pos4]",
                57: "remove-acl-rule [pos5]",
                58: "remove-acl-rule [pos6]",
                59: "remove-acl-rule [pos7]",
                60: "remove-acl-rule [pos8]",
                61: "remove-acl-rule [pos9]",
                62: "disable-nic (domain_controller)",
                63: "enable-nic (domain_controller)",
                64: "disable-nic (web_server)",
                65: "enable-nic (web_server)",
                66: "disable-nic (database_server)",
                67: "enable-nic (database_server)",
                68: "disable-nic (backup_server)",
                69: "enable-nic (backup_server)",
                70: "disable-nic (security_suite)",
                71: "enable-nic (security_suite)",
                72: "disable-nic2 (security_suite)",
                73: "enable-nic2 (security_suite)",
                74: "disable-nic (client_1)",
                75: "enable-nic (client_1)",
                76: "disable-nic (client_2)",
                77: "enable-nic (client_2)",
                78: "scan-app [web-browser] (client_1)",
                79: "scan-app [web-browser] (client_2)",
                80: "close-app [data-manip-bot] (client_1)",
                81: "close-app [data-manip-bot] (client_2)",
                82: "add-acl-rule [pos6]",
                83: "add-acl-rule [pos7]",
            }

        return action_names.get(action_id, f"action-{action_id}")

    def _determine_severity(self, action_name: str) -> str:
        """Determine severity level based on action"""
        critical_actions = ["ransomware", "exfiltrate", "corrupt-file"]
        high_actions = ["dos-bot", "data-manipulation-bot", "shutdown"]
        medium_actions = ["scan", "remote-command", "configure", "disable-nic"]

        if any(a in action_name for a in critical_actions):
            return "critical"
        elif any(a in action_name for a in high_actions):
            return "high"
        elif any(a in action_name for a in medium_actions):
            return "medium"
        else:
            return "low"
