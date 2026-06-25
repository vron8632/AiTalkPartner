from django.db import models


class Lesson(models.Model):
    EXERCISE_TYPES = [
        ('speech', '有准备演讲'),
        ('impromptu', '即兴表达'),
        ('story', '故事讲述'),
        ('debate', '辩论/说服'),
    ]

    level_id = models.IntegerField('阶段', help_text='1-5阶')
    lesson_id = models.IntegerField('课程序号')
    title = models.CharField('标题', max_length=100)
    description = models.TextField('描述', blank=True, default='')
    prompt_key = models.CharField('Prompt模板', max_length=50)
    exercise_type = models.CharField('练习类型', max_length=30, choices=EXERCISE_TYPES)
    duration_goal = models.IntegerField('目标时长(秒)', default=60)
    is_free = models.BooleanField('免费', default=True)
    sort_order = models.IntegerField('排序', default=0)
    theory_content = models.TextField('理论讲解', blank=True, default='')
    example_text = models.TextField('范例文本', blank=True, default='')

    class Meta:
        verbose_name = '课程'
        verbose_name_plural = '课程'
        unique_together = ['level_id', 'lesson_id']
        ordering = ['level_id', 'sort_order']

    def __str__(self):
        return f'L{self.level_id}-{self.lesson_id} {self.title}'


class UserProgress(models.Model):
    STATUS_CHOICES = [
        ('locked', '未解锁'),
        ('unlocked', '已解锁'),
        ('completed', '已完成'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name='用户')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, verbose_name='课程')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='locked')
    best_score = models.DecimalField('最高分', max_digits=5, decimal_places=1, blank=True, null=True)
    completed_at = models.DateTimeField('完成时间', blank=True, null=True)

    class Meta:
        verbose_name = '用户进度'
        verbose_name_plural = '用户进度'
        unique_together = ['user', 'lesson']

    def __str__(self):
        return f'{self.user_id}-L{self.lesson_id}:{self.status}'
