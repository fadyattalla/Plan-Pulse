# Final Project: PlanPulse
[YouTube Video](https://youtu.be/cFmC6TKGf2k)

Hello everyone! I hope you enjoyed the demonstration video on YouTube. There were a few things I would have exceeded the 5-minute limit if I had mentioned them in the video, so I'll be discussing them here.

## Distinctiveness and Complexity

PlanPulse is one of the simplest, yet most rewarding projects I've invested a lot time and effort in. I've always wanted to create a task manager or planner that effectively handles tasks, whether short-term or long-term. The reason I chose to work on the idea of creating a task planner is the fact that it's something many people struggle with. Many of us find it very difficult to manage even the simplest tasks, which is why I decided to create an app that is simple yet visually appealing enough to make users want to give it a try.

PlanPulse is a single-page application, and I can tell you that I have learned A LOT while creating that app. One of the complexities that I learned from the most is that, while I was creating the app, I wasn't careful at all with the event listeners. During one of the testing stages, I realized a HUGE problem that I never thought I would come across. Apparently, since my app is a single-page application, there were many routes taking place. Most of these routes, if not all, were API routes, which caused an issue I never thought of. That issue was that I, as a user, was on the same routes for almost all the time, except for the login and logout routes, of course.


What happened is that event listeners were overlapping. Yes, overlapping. How? I have no idea. I never once thought in my entire code journey that this could happen, and yet it did. I spent almost 3-4 days alone trying to debug and get everything working back as it should without ruining the code. Let me tell you, it was the most hectic experience I've ever had to deal with. I had to reorganize and debug the whole code to get it working again as it should. Not to mention the other issues I had to work with, including flatpickr, a JS library, that was refusing to send the proper Date formats to Django, as well as the other bugs related to sending images through JavaScript to Django that was resolved by using FileReader in JS:
```javascript
new FileReader();
```
and using the following libraries in Python:
```python
import base64
import imghdr
import uuid
from django.core.files.base import ContentFile
```
Images sent to Django are being stored inside the media directory located at this path: planner\media

This project was one of the toughest projects I ever worked on, yet I'm so glad I did. Because for me, making mistakes and then figuring out how to fix them has consistently proven to be the most effective learning method. And now that project will become a reference to the bugs I will encounter in the future.

Two things I didn't have time to mention in the video are:

1. If a task's due date is past the due date, the due date field will automatically change to become this:

![Due Date Error](https://i.ibb.co/GCHGN70/pastduedate.png)

2. If a user tried to create a task number that already exists:

![Task No. Exists](https://i.ibb.co/S58r4sY/Screenshot-2024-05-14-163306.png)

These are two of the main error messages that I didn't have the opportunity to mention in the video. There are a few more including client-side and server-side validation errors.

Lastly, I want to mention that this project features plenty of animations that greatly enhance the user experience, making it more fun and interactive. All animations are included in the content.css static file.

### Fun fact: I used bootstrap's icons to create the project's logo. :)


# THE END

