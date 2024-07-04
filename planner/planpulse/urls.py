from django.urls import path
from . import views

app_name = "planpulse"

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API 
    path("api.projects", views.list_projects, name="list_projects"),
    path("api.tasks/<int:project_id>", views.list_tasks, name="list_tasks")
]

