"""自适应帧选择策略"""

import hashlib
import time
from dataclasses import dataclass


@dataclass
class FrameInfo:
    base64: str
    hash: str
    timestamp: float
    triggered_by: str  # "vad" or "timer"


class FrameManager:
    """帧选择策略：VAD触发 + hash去重 + 时间窗口控制"""

    def __init__(self, min_interval: float = 1.0):
        self.min_interval = min_interval  # 最小发送间隔（秒）
        self.last_frame_time = 0.0
        self.last_frame_hash = ""
        self.current_frame: FrameInfo | None = None
        self.frame_count = 0

    def should_send_frame(self, base64_jpeg: str, trigger: str = "vad") -> bool:
        """判断是否应该发送该帧

        Args:
            base64_jpeg: JPEG 图片的 base64 数据
            trigger: 触发来源 ("vad" 或 "timer")

        Returns:
            True 如果应该发送
        """
        now = time.time()

        # 画面变化检测
        frame_hash = hashlib.md5(base64_jpeg.encode()).hexdigest()
        if frame_hash == self.last_frame_hash:
            return False  # 画面没变化

        # 时间窗口控制
        if now - self.last_frame_time < self.min_interval:
            return False  # 距离上一帧太近

        self.last_frame_hash = frame_hash
        self.last_frame_time = now
        self.frame_count += 1
        self.current_frame = FrameInfo(
            base64=base64_jpeg,
            hash=frame_hash,
            timestamp=now,
            triggered_by=trigger,
        )
        return True

    def get_current_frame(self) -> str | None:
        """获取当前帧的 base64 数据"""
        if self.current_frame:
            return self.current_frame.base64
        return None

    def reset(self):
        """重置状态"""
        self.last_frame_time = 0.0
        self.last_frame_hash = ""
        self.current_frame = None