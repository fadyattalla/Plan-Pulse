from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser, Group, Permission

def validate_image_size(image):
    max_size = 500 * 1024
    if image.size > max_size:
        raise ValidationError("Image size must not exceed 500KB.")

class User(AbstractUser):
    email = models.EmailField(
        unique=True,
        max_length=254,
        null=False,
        blank=False,
        verbose_name="email address"
        )

    class Meta:
        swappable = 'AUTH_USER_MODEL'

    groups = models.ManyToManyField(Group, related_name='custom_users_groups')

    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        related_name='custom_users_permissions',
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return self.username

class Project(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=150, blank=False, null=False)
    creation_date = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "creation_date": self.creation_date.strftime("%m/%d/%Y, %H:%M %p")
        }

class Task(models.Model):
    STATUS_CHOICES = [
        ('UNDECIDED', 'Undecided'),
        ('TO_DO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    ]

    PRIORITY_CHOICES = [
        ('URGENT', 'Urgent'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
        ('UNSPECIFIED', 'Unspecified'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    number = models.PositiveIntegerField(blank=False, null=False, verbose_name='No.')
    title = models.CharField(max_length=80, blank=False, null=False, verbose_name='Title')
    description = models.CharField(max_length=1000, null=True, blank=True, verbose_name='Description')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNDECIDED', verbose_name='Status')
    priority = models.CharField(max_length=15, choices=PRIORITY_CHOICES, default='UNSPECIFIED', verbose_name='Priority')
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='Due Date')
    media = models.ImageField(null=True, blank=True, verbose_name='Media', validators=[validate_image_size])
    notes = models.CharField(max_length=250, blank=True, null=True, verbose_name='Notes')

    class Meta:
        unique_together = ('project', 'user', 'number')

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project.id,
            "user_id": self.user.id,
            "number": self.number,
            "title": self.title,
            "description": self.description,
            "status": self.get_status_display(),
            "priority": self.get_priority_display(),
            "due_date": self.due_date.strftime("%m/%d/%Y, %I:%M %p") if self.due_date else None,
            "media": self.media.url if self.media else None,
            "notes": self.notes
        }

    def __str__(self):
        return self.title