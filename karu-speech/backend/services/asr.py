import os
import subprocess

from aip import AipSpeech
from django.conf import settings

# 清除系统代理，避免干扰 API 调用
for k in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY']:
    os.environ.pop(k, None)

client = AipSpeech(settings.BAIDU_APP_ID, settings.BAIDU_API_KEY, settings.BAIDU_SECRET_KEY)


def transcribe(audio_path: str) -> str:
    pcm_path = audio_path + '.pcm'
    try:
        subprocess.run([
            'ffmpeg', '-y', '-i', audio_path,
            '-ar', '16000', '-ac', '1', '-f', 's16le',
            pcm_path,
        ], capture_output=True, check=True)

        with open(pcm_path, 'rb') as f:
            audio_data = f.read()

        result = client.asr(audio_data, 'pcm', 16000, {
            'dev_pid': 1537,  # 普通话(中文)
        })

        if result.get('err_no') == 0:
            return ''.join(result['result'])
        err_msg = result.get('err_msg', 'unknown')
        raise Exception(f'Baidu ASR error: {err_msg}')
    finally:
        if os.path.exists(pcm_path):
            os.remove(pcm_path)
