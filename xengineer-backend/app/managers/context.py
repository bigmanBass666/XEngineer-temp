"""多轮对话上下文管理器

独立的上下文管理模块，可被 VLMNode 或其他节点复用。
将对话历史以「轮次（DialogTurn）」为单位组织，
提供 build_messages() 方法直接生成 LLM 所需的消息列表。
"""

import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class DialogTurn:
    """一轮对话

    Attributes:
        user_text: 用户输入文本
        assistant_text: AI 回复文本（初始为空，调用 complete_last_turn 后填充）
        image_url: 该轮用户发送的图片（可选）
        timestamp: 轮次创建时间戳
    """
    user_text: str
    assistant_text: str = ""
    image_url: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


class ContextManager:
    """管理多轮对话上下文

    将对话历史以 DialogTurn 为单位进行管理，支持：
    - 系统提示词配置
    - 图片 URL 跟踪（每轮可附带一张图片）
    - 自动裁剪超出上限的历史轮次
    - 直接构建 LLM API 所需的 messages 列表

    Args:
        max_rounds: 保留的最大对话轮数，默认 5
    """

    def __init__(self, max_rounds: int = 5):
        self.max_rounds = max_rounds
        self.history: list[DialogTurn] = []
        self.system_prompt: str = ""

    # ── 写入 ────────────────────────────────────────────

    def set_system_prompt(self, prompt: str):
        """设置/更新系统提示词"""
        self.system_prompt = prompt

    def add_user_turn(self, text: str, image_url: str | None = None):
        """添加一轮用户消息

        assistant_text 初始为空字符串，需在收到 AI 回复后
        调用 complete_last_turn() 填充。

        Args:
            text: 用户输入文本
            image_url: 该轮用户发送的图片 URL（可选）
        """
        self.history.append(DialogTurn(
            user_text=text,
            assistant_text="",
            image_url=image_url,
            timestamp=time.time(),
        ))
        self._trim()

    def complete_last_turn(self, assistant_text: str):
        """完成最后一轮对话，填入 AI 回复

        Args:
            assistant_text: AI 的完整回复文本

        Raises:
            IndexError: 当 history 为空时调用
        """
        if not self.history:
            raise IndexError("没有待完成的对话轮次，请先调用 add_user_turn()")
        self.history[-1].assistant_text = assistant_text

    # ── 读取 / 构建 ─────────────────────────────────────

    def build_messages(self, current_text: str, current_image_url: str | None = None) -> list[dict]:
        """构建发送给 LLM 的消息列表

        组装顺序: system prompt → 历史轮次 → 当前用户消息

        Args:
            current_text: 当前用户输入文本（尚未 add_user_turn 的新消息）
            current_image_url: 当前消息附带的图片 URL（可选）

        Returns:
            符合 OpenAI Chat Completions API 格式的消息列表
        """
        messages: list[dict] = []

        # System prompt
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})

        # 历史对话
        for turn in self.history:
            # 用户消息（多模态 content）
            user_content: list[dict] = [
                {"type": "text", "text": turn.user_text}
            ]
            if turn.image_url:
                user_content.append({
                    "type": "image_url",
                    "image_url": {"url": turn.image_url},
                })
            messages.append({"role": "user", "content": user_content})

            # AI 回复
            if turn.assistant_text:
                messages.append({
                    "role": "assistant",
                    "content": turn.assistant_text,
                })

        # 当前用户消息
        if current_text:
            user_content: list[dict] = [
                {"type": "text", "text": current_text}
            ]
            if current_image_url:
                user_content.append({
                    "type": "image_url",
                    "image_url": {"url": current_image_url},
                })
            messages.append({"role": "user", "content": user_content})

        return messages

    def get_latest_image(self) -> str | None:
        """获取最近一轮附带图片的 URL

        从最新轮次向前搜索，返回第一个找到的图片 URL。

        Returns:
            图片 URL 或 None
        """
        for turn in reversed(self.history):
            if turn.image_url:
                return turn.image_url
        return None

    # ── 管理 ────────────────────────────────────────────

    def clear(self):
        """清除所有对话历史"""
        self.history.clear()

    @property
    def turn_count(self) -> int:
        """当前对话轮次数"""
        return len(self.history)

    # ── 内部 ────────────────────────────────────────────

    def _trim(self):
        """裁剪超出 max_rounds 限制的历史"""
        if len(self.history) > self.max_rounds:
            self.history = self.history[-self.max_rounds:]