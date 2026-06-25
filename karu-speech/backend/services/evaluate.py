import json
import os
from openai import OpenAI
from django.conf import settings

# 清除系统代理，避免干扰 API 调用
for k in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY']:
    os.environ.pop(k, None)

PROMPT_TEMPLATE = """你是一位卡耐基魅力演说教练。请从以下维度评价用户的演讲内容（0-100分）：

1. **自信度**（Confidence）：语气是否坚定，是否有犹豫/自我否定/填充词过多
2. **结构清晰度**（Structure）：是否有开头-主体-结尾的黄金结构
3. **情感感染力**（Emotion）：是否有故事、画面感、真实情感
4. **逻辑说服力**（Logic）：论证是否有力，观点是否清晰
5. **语言表达**（Language）：用词是否精准丰富，句式是否多样

用户演讲内容：
{transcript}

请严格按照以下JSON格式返回评价（不要返回其他任何内容）：
{{
  "scores": {{"confidence": 72, "structure": 68, "emotion": 65, "logic": 70, "language": 73}},
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": ["改进点1", "改进点2"],
  "summary": "一段50字以内，带有具体观察和鼓励的总结评语",
  "tips": ["下次练习的具体建议1", "下次练习的具体建议2"]
}}"""


def evaluate_speech(transcript: str) -> dict:
    client = OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url='https://api.deepseek.com',
    )
    resp = client.chat.completions.create(
        model='deepseek-chat',
        messages=[{'role': 'user', 'content': PROMPT_TEMPLATE.format(transcript=transcript)}],
        temperature=0.7,
    )
    content = resp.choices[0].message.content.strip()
    content = content.removeprefix('```json').removeprefix('```').removesuffix('```').strip()
    return json.loads(content)
