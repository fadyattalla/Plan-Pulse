import json
import base64
import imghdr
import uuid
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.db import IntegrityError
from django.urls import reverse
from django.shortcuts import render, HttpResponseRedirect
from django.core.exceptions import ValidationError, FieldDoesNotExist
from django.core.files.base import ContentFile
from django.http import JsonResponse
from time import sleep
from django import forms
from .models import User, Project, Task

class NewProject(forms.Form):
    project_title = forms.CharField(label="", widget=forms.TextInput(attrs={
        "id": "project_title", 
        "placeholder": "Project Title", 
        "autofocus": True,
        "class": "form-control mb-3 mt-2"
        }), 
        required=True, 
        max_length=150)


def index(request):
    if request.user.is_authenticated:
        form = NewProject()
        return render(request, "planpulse/index.html", {
            "form": form
        })
    else:
        return login_view(request)
    
def list_projects(request):
    if request.user.is_authenticated:
        if request.method == 'POST':
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON data'}, status=400)
            
            project_title = data.get("title", "")

            if not project_title or project_title == "":
                return JsonResponse({
                    "error": "Title is required for each project."
                }, status=400)

            try:
                project = Project(title=project_title, owner=request.user)
                project.full_clean()
                project.save()
                return JsonResponse({'message': 'Project created successfully!'}, status=201)
            except Exception as e:
                return JsonResponse({
                    "error": f"Failed to create project: {e}"
                }, status=500)
        else:
            content = Project.objects.filter(owner=request.user).all().order_by("-creation_date")
            content_serialized = [i.serialize() for i in content]
            return JsonResponse(content_serialized, safe=False)
    
    else:
        messages.info(request, "Please login to view your projects.")
        return login_view(request)

def list_tasks(request, project_id):
    if request.user.is_authenticated:
        if request.method == 'PUT':
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON data'}, status=400)
            
            dataHeader = data.get("data_type", "")
            content = data.get("content", "")
            task_num = data.get("task_num", "")

            if dataHeader not in ['status', 'priority']:
                headerConverted = dataHeader.replace(" ", "_").lower()
            else:
                headerConverted = dataHeader.replace(" ", "_").lower()
                content = content.replace(" ", "_").upper()

            try:
                Task._meta.get_field(headerConverted)
            except FieldDoesNotExist:
                return JsonResponse({'error': f'Field "{headerConverted}" does not exist in Task model'}, status=400)
            
            if headerConverted == 'media':
                image_data = base64.b64decode(content.split(",")[1])
                extension = imghdr.what(None, h=image_data)
                if extension:
                    image_name = f"image_{uuid.uuid4()}.{extension}"
                    image_file = ContentFile(image_data, name=image_name)
                    content = image_file

            try:
                task = Task.objects.get(user=request.user, project=project_id, number=task_num)
                setattr(task, headerConverted, content)
                task.full_clean()
                task.save()
                return JsonResponse({'message': 'Task has been edited successfully!'}, status=201)
            except ValidationError as e:
                response_messages = [str(message) for message in e.messages]
                return JsonResponse({'error': response_messages}, status=400)

        elif request.method == 'POST':
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON data'}, status=400)

            task_no = data.get("task_no", "")
            task_title = data.get("task_title", "")
            task_description = data.get("task_description", "")
            task_status = data.get("task_status", "")
            task_priority = data.get("task_priority", "")
            task_date = data.get("task_date", "")
            task_attachment = data.get("task_attachment", "")
            task_notes = data.get("task_notes", "")

            if not task_no or task_no == "":
                return JsonResponse({
                    "error": "Title is required for each project."
                }, status=400)

            if not task_title or task_title == "":
                return JsonResponse({
                    "error": "Title is required for each project."
                }, status=400)
            
            if task_attachment:
                image_data = base64.b64decode(task_attachment.split(",")[1])
                extension = imghdr.what(None, h=image_data)
                if extension:
                    image_name = f"image_{uuid.uuid4()}.{extension}"
                    image_file = ContentFile(image_data, name=image_name)
                    task_attachment = image_file

            try:
                related_project=Project.objects.get(pk=project_id, owner=request.user)
            except Project.DoesNotExist:
                return JsonResponse({'error': 'Project does not exist'}, status=400)

            try:
                task = Task(
                    project=related_project,
                    user=request.user,
                    number=task_no,
                    title=task_title,
                    description=task_description,
                    status=task_status.upper().replace(" ", "_"),
                    priority=task_priority.upper(),
                    due_date=task_date,
                    media=task_attachment,
                    notes=task_notes
                )
                task.full_clean()
                task.save()
                return JsonResponse({'message': 'Task has been created successfully!'}, status=201)
            except ValidationError as e:
                response_messages = [str(message) for message in e.messages]
                return JsonResponse({'error': response_messages}, status=400)

        else:
            try:
                project = Project.objects.get(pk=project_id, owner=request.user)
            except Project.DoesNotExist:
                return JsonResponse({"error": f"Project not found."}, status=404)

            task_verbose_names = [field.verbose_name for field in Task._meta.get_fields()]
            tasks = Task.objects.filter(project=project, user=request.user).order_by("number")

            tasks_serialized = [task.serialize() for task in tasks]
            tasks_data = {'tasks': tasks_serialized, 'verbose_names': task_verbose_names}

            return JsonResponse(tasks_data, safe=False)

    else:
        return login_view(request)

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, "You are now logged in.")
            return HttpResponseRedirect(reverse("planpulse:index"))
        else:
            messages.error(request, "Invalid Username/Password.")
            return HttpResponseRedirect(reverse("planpulse:login"))
        
    else:
        return render(request, "planpulse/login.html")

def logout_view(request):
    logout(request)
    messages.success(request, 'You have been successfully logged out.')
    return HttpResponseRedirect(reverse("planpulse:login"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]

        firstName = request.POST.get("firstname")
        lastName = request.POST.get("lastname")

        if firstName is None:
            firstName = ""
        if lastName is None:
            lastName = ""

        if password != confirmation:
            messages.error = (request, "Please make sure your passwords match.")
            return HttpResponseRedirect(reverse("planpulse:register"))
        try:
            email_exists = User.objects.get(email=email)

            if email_exists:
                messages.error(request, "Email already exists")
                return HttpResponseRedirect(reverse("planpulse:register"))

        except User.DoesNotExist:
            try:
                user = User.objects.create_user(username, email, password)
                user.first_name = firstName
                user.last_name = lastName
                user.save()
            except IntegrityError:
                messages.error(request, "Username already taken.")
                return HttpResponseRedirect(reverse("planpulse:register"))
            
        sleep(0.5)
        login(request, user)
        messages.success(request, "Your account has been registered successfully!")
        return HttpResponseRedirect(reverse("planpulse:index"))
    
    else:
        return render(request, "planpulse/register.html")