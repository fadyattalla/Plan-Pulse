from django.contrib import admin
from .models import Project, User, Task

# Register your models here.
admin.site.register(User)
admin.site.register(Project)
admin.site.register(Task)
