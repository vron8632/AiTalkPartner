from django.db import models


class PracticeRecord(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name='用户')
    lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, verbose_name='课程')
    audio_url = models.TextField('录音地址', blank=True, null=True)
    transcript = models.TextField('转录文本', blank=True, null=True)
    scores = models.JSONField('评分', blank=True, null=True, help_text='{"confidence":85,"structure":72,...}')
    feedback = models.JSONField('反馈', blank=True, null=True, help_text='{"strengths":[],"improvements":[],...}')
    duration_sec = models.IntegerField('时长(秒)', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '练习记录'
        verbose_name_plural = '练习记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id}-L{self.lesson_id} @ {self.created_at:%m-%d %H:%M}'
