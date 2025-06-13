# CODESTORM Python CLI using OpenHands
# This script is inspired by the OpenHands main entrypoint.
# It initializes an asynchronous loop and delegates execution to OpenHands
# components when available.

import asyncio
import logging
import os
import sys

try:
    import openhands.agenthub  # noqa: F401
    from openhands.cli.commands import check_folder_security_agreement, handle_commands
    from openhands.cli.settings import modify_llm_settings_basic
    from openhands.cli.tui import (
        UsageMetrics,
        display_banner,
        display_runtime_initialization_message,
        display_welcome_message,
        update_streaming_output,
    )
    from openhands.core.config import OpenHandsConfig, parse_arguments, setup_config_from_args
    from openhands.core.loop import run_agent_until_done
    from openhands.core.setup import (
        create_agent,
        create_controller,
        create_memory,
        create_runtime,
        generate_sid,
        initialize_repository_for_runtime,
    )
    from openhands.core.logger import openhands_logger as logger
    from openhands.core.schema import AgentState
    from openhands.events.event import Event
    from openhands.events import EventSource, EventStreamSubscriber
    from openhands.events.action import ChangeAgentStateAction, MessageAction
    from openhands.events.observation import AgentStateChangedObservation
    from openhands.storage.settings.file_settings_store import FileSettingsStore
except Exception:  # pragma: no cover - OpenHands might not be installed
    openhands_available = False
else:
    openhands_available = True


async def main_with_loop(loop: asyncio.AbstractEventLoop) -> None:
    if not openhands_available:
        print("OpenHands library not installed. Please install it to use the CLI.")
        return

    args = parse_arguments()
    logger.setLevel(logging.WARNING)
    config: OpenHandsConfig = setup_config_from_args(args)
    settings_store = await FileSettingsStore.get_instance(config=config, user_id=None)
    settings = await settings_store.load()
    if not settings:
        display_banner(session_id="setup")
        await modify_llm_settings_basic(config, settings_store)
        settings = await settings_store.load()

    if settings:
        if args.agent_cls:
            config.default_agent = str(args.agent_cls)
        else:
            assert settings.agent is not None
            config.default_agent = settings.agent
        config.security.confirmation_mode = settings.confirmation_mode or False

    if not config.workspace_base:
        config.workspace_base = os.getcwd()

    if not check_folder_security_agreement(config, config.workspace_base):
        return

    sid = generate_sid(config, args.name)
    usage_metrics = UsageMetrics()

    agent = create_agent(config)
    runtime = create_runtime(config, sid=sid, headless_mode=True, agent=agent)

    def stream_to_console(output: str) -> None:
        update_streaming_output(output)

    runtime.subscribe_to_shell_stream(stream_to_console)
    controller, initial_state = create_controller(agent, runtime, config)

    event_stream = runtime.event_stream

    async def on_event_async(event: Event) -> None:
        if isinstance(event, AgentStateChangedObservation):
            if event.agent_state in [AgentState.AWAITING_USER_INPUT, AgentState.FINISHED]:
                await handle_commands("", event_stream, usage_metrics, sid, config, config.workspace_base, settings_store)

    def on_event(event: Event) -> None:
        loop.create_task(on_event_async(event))

    event_stream.subscribe(EventStreamSubscriber.MAIN, on_event, sid)

    await runtime.connect()
    if config.sandbox.selected_repo:
        initialize_repository_for_runtime(runtime, config.sandbox.selected_repo)
    memory = create_memory(runtime, event_stream, sid, config.sandbox.selected_repo, None, None)

    display_banner(session_id=sid)
    display_welcome_message("What do you want to build?")

    await run_agent_until_done(controller, runtime, memory, [AgentState.STOPPED, AgentState.ERROR])

    await runtime.close()
    await controller.close()


def main() -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main_with_loop(loop))
    finally:
        pending = asyncio.all_tasks(loop)
        for task in pending:
            task.cancel()
        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        loop.close()


if __name__ == "__main__":
    main()
