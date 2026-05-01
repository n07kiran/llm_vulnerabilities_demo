from collections import defaultdict
from threading import Lock

from backend.app.schemas.chat import ChatMessage


class ConversationStore:
    def __init__(self) -> None:
        self._messages: dict[tuple[str, str], list[ChatMessage]] = defaultdict(list)
        self._lock = Lock()

    def get(self, session_id: str, slug: str) -> list[ChatMessage]:
        with self._lock:
            return list(self._messages[(session_id, slug)])

    def append_pair(
        self,
        session_id: str,
        slug: str,
        user_message: ChatMessage,
        assistant_message: ChatMessage,
    ) -> list[ChatMessage]:
        with self._lock:
            key = (session_id, slug)
            self._messages[key].extend([user_message, assistant_message])
            return list(self._messages[key])

    def reset(self, session_id: str, slug: str) -> list[ChatMessage]:
        with self._lock:
            self._messages[(session_id, slug)] = []
            return []


conversation_store = ConversationStore()
