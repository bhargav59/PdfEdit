"""Worker handler registry.

Exposes HANDLER_REGISTRY which maps tool names to their handler callables.
Imported lazily by ``shared.tasks.process_job`` at execution time.
"""

from __future__ import annotations

from worker.handlers.merge import merge_handler
from worker.handlers.split import split_handler
from worker.handlers.compress import compress_handler
from worker.handlers.convert import convert_handler

HANDLER_REGISTRY: dict[str, object] = {
    "merge": merge_handler,
    "split": split_handler,
    "compress": compress_handler,
    "convert": convert_handler,
}
