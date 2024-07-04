document.addEventListener('DOMContentLoaded', () => {
    load_projects();

    const createIcon = document.querySelector('#create-proj-icon');
    createIcon.addEventListener('click', () => {
        new_project();
    });

    const createProjIcon = document.querySelector('#create-proj-exist-icon');
    createProjIcon.addEventListener('click', () => {
        new_project();
    });

    const backPageBtn = document.querySelector('#backpage-btn i');
    backPageBtn.addEventListener('click', () => {
        load_projects();
    });

    const newProjectDiv = document.querySelector('#newproject-view');
    document.querySelector('#newproject-exit-icon i').addEventListener('click', () => {
        newProjectDiv.style.transform = "translateY(-40%) translateX(100%)";
        setTimeout(() => {
            newProjectDiv.style.display = 'none';
        }, 200);
        
    });

    const editTask = document.querySelector('#edit-view');
    editTask.querySelector('#editview-exit-icon').addEventListener('click', () => {
        editTask.style.display = 'none';
    });

    const newTaskDiv = document.querySelector('#newtask-modal');
    document.querySelector('#newtask-exit-icon').addEventListener('click', () => {
        newTaskDiv.style.transform = "translateY(-40%) translateX(100%)";
        setTimeout(() => {
            newTaskDiv.style.display = 'none';
        }, 200);
    });

    const dateErrMsg = createErrorMessage();
    const dateField = document.querySelector('#taskduedate');
    flatpickr(dateField, {
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i",
        minDate: "today",
        theme: "dark",
        onChange: function(selectedDates, dateStr, instance) {
            if (!isValidDateTimeFormat(dateStr)) {
                dateErrMsg.style.display = 'block';
                dateErrMsg.style.color = 'red';
                dateErrMsg.innerText = "Due date field must match this format: (MM/DD/YYYY HH:MM PM/AM)";
                dateField.style.borderColor = 'red';
            } else {
                dateErrMsg.style.display = 'none';
                dateField.style.borderColor = '#7c7c7c91';
            }
        }
    });
    
    const newTaskForm = document.querySelector('#newtask-modal #task-creation-form');

    const taskNum = newTaskForm.querySelector('#tasknumber');
    taskNum.addEventListener('blur', () => validateNumber(taskNum));
    
    const taskTitle = newTaskForm.querySelector('#tasktitle');
    taskTitle.addEventListener('blur', () => validateLength(taskTitle, 80, 'Title cannot exceed 80 characters.'));
    
    const taskDescription = newTaskForm.querySelector('#taskdescription');
    taskDescription.addEventListener('blur', () => validateLength(taskDescription, 1000, 'Description cannot exceed 1000 characters.'));
    
    const taskStatusMenu = newTaskForm.querySelector('#taskstatus');
    taskStatusMenu.addEventListener('change', () => validateDropdown(taskStatusMenu, ['Undecided', 'To Do', 'In Progress', 'Done'], 'Unknown Selection...'));
    
    const taskPriorityMenu = newTaskForm.querySelector('#taskpriority');
    taskPriorityMenu.addEventListener('change', () => validateDropdown(taskPriorityMenu, ['Unspecified', 'Urgent', 'High', 'Medium', 'Low'], 'Unknown Selection...'));
    
    const taskAttachment = newTaskForm.querySelector('#taskattachment');
    const errMsg = createErrorMessage();
    taskAttachment.addEventListener('change', () => {

        const selectedFile = taskAttachment.files[0];
        const maxSize = 500 * 1024; // 500KB

        if (selectedFile && selectedFile.size > maxSize) {
            errMsg.style.display = 'block';
            errMsg.style.color = 'red';
            errMsg.innerText = "File size exceeded the limit. Please select a file that's below 500KB in size.";
            taskAttachment.style.borderColor = 'red';
            return false;

        } else {
            errMsg.style.display = 'none';
            taskAttachment.style.borderColor = '#7c7c7c91';
            return true;
        }
    });
    
    const taskNotes = newTaskForm.querySelector('#tasknotes');
    taskNotes.addEventListener('blur', () => validateLength(taskNotes, 250, 'Notes cannot exceed 250 characters.'));

    const taskDate = newTaskForm.querySelector('#taskduedate');

    newTaskForm.addEventListener('submit', (event) => {
        event.preventDefault();
    
        const file = taskAttachment.files[0];
    
        if (!file) {
            const Attachments = null;
    
            const taskData = {
                task_no: taskNum.value,
                task_title: taskTitle.value,
                task_description: taskDescription.value,
                task_status: taskStatusMenu.value,
                task_priority: taskPriorityMenu.value,
                task_date: taskDate.value,
                task_attachment: Attachments,
                task_notes: taskNotes.value
            };
    
            sendData(taskData);
        } else {
            const reader = new FileReader();
    
            reader.onload = (event) => {
                const Attachments = event.target.result;
    
                const taskData = {
                    task_no: taskNum.value,
                    task_title: taskTitle.value,
                    task_description: taskDescription.value,
                    task_status: taskStatusMenu.value,
                    task_priority: taskPriorityMenu.value,
                    task_date: taskDate.value,
                    task_attachment: Attachments,
                    task_notes: taskNotes.value
                };
    
                sendData(taskData);
            };
    
            reader.readAsDataURL(file);
        }
    });
    
    function sendData(taskData) {
        const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let projectDatasetId = document.querySelector('#project-tasks-title').dataset.projectid;
        let projectTitle = document.querySelector('#project-tasks-title').textContent;

        fetch(`/api.tasks/${projectDatasetId}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf_token
            },
            body: JSON.stringify(taskData)
        })
        .then(response => {
            if (response.ok) {
                let taskDiv = document.querySelector('#newtask-modal');
                taskDiv.style.display = 'none';
                taskDiv.style.transform = "translateY(-40%) translateX(100%)";
                setTimeout(() => {
                    taskDiv.style.display = 'none';
                }, 200);
                taskNum.value = '';
                taskTitle.value = '';
                taskDescription.value = '';
                taskStatusMenu.value = 'Select status';
                taskPriorityMenu.value = 'Select priority';
                taskDate.value = '';
                taskAttachment.value = '';
                taskNotes.value = '';
    
                load_tasks(projectDatasetId, projectTitle);
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (data.error) {
                data.error.forEach(message => {
                    displayError(message);
                });
            }
        })
        .catch(error => {
            console.log('Error:', error.message)
        });
    }
    
    
    const projectForm = document.querySelector('#newproject-view form');
    projectForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const proj_title = document.querySelector('#project-creation-form #project_title');
        
        if (!proj_title.value.trim() || proj_title.value.length > 150) {
            return false;
        }

        fetch('/api.projects', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf_token
            },
            body: JSON.stringify({
                title: proj_title.value,
            })
        })
        .then(response => {
            if (response.ok) {
                proj_title.value = '';
                document.querySelector('#create-proj-icon').style.display = 'none';
                let projectDiv = document.querySelector('#newproject-view');
                projectDiv.style.transform = "translateY(-40%) translateX(100%)";
                setTimeout(() => {
                    projectDiv.style.display = 'none';
                }, 200);
                load_projects();
            }
        })
        .catch(error => {
            console.log('Error:', error);
        });

    });

});

function edit_view(content, header, project_id, project_title, taskNumber) {
    const editView = document.querySelector('#edit-view');
    const editContent = document.querySelector('#edit-content');
    const editHeader = document.querySelector('#edit-header');

    editHeader.innerHTML = `${header.charAt(0).toUpperCase()}${header.slice(1).replace("_", " ")} <span id="edit-task-icon"><i data-id="${project_id}" class="bi bi-pencil-square"></i></span>`;
    editContent.innerHTML = content;
    editView.style.display = 'block';

    const editTaskIcon = document.querySelector('#edit-task-icon i');
    if (editTaskIcon){
        editTaskIcon.addEventListener('click', () => {
            let newInputField;
            if (header === 'description') {
                newInputField = document.createElement('textarea');
                newInputField.type = 'textarea';
                newInputField.className = 'form-control mb-3';
                newInputField.value = content;
                newInputField.style.minWidth = '550px';
                newInputField.rows = 5;

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);
                
            } else if (header === 'number') {
                newInputField = document.createElement('input');
                newInputField.type = 'number';
                newInputField.className = 'form-control mb-3';
                newInputField.value = content;
                newInputField.style.minWidth = '100px';

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);

            } else if (header === 'title' || header === 'notes') {
                newInputField = document.createElement('input');
                newInputField.type = 'text';
                newInputField.className = 'form-control mb-3';
                newInputField.value = content;
                newInputField.style.minWidth = '350px';

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);

            } else if (header === 'status') {
                newInputField = document.createElement('select');
                newInputField.className = 'form-select mb-3';

                const optionOne = document.createElement('option');
                optionOne.innerText = 'Undecided';
                optionOne.classList.add('truncate-150', 'color-grey');

                const optionTwo = document.createElement('option');
                optionTwo.innerText = 'To Do';
                optionTwo.classList.add('truncate-150', 'color-blue');

                const optionThree = document.createElement('option');
                optionThree.innerText = 'In Progress';
                optionThree.classList.add('truncate-150', 'color-orange');

                const optionFour = document.createElement('option');
                optionFour.innerText = 'Done';
                optionFour.classList.add('truncate-150', 'color-green');

                newInputField.innerText = optionOne;
                newInputField.style.minWidth = '200px';

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);

                newInputField.appendChild(optionOne);
                newInputField.appendChild(optionTwo);
                newInputField.appendChild(optionThree);
                newInputField.appendChild(optionFour);

            } else if (header === 'priority') {
                newInputField = document.createElement('select');
                newInputField.className = 'form-select mb-3';

                const optionOne = document.createElement('option');
                optionOne.innerText = 'Unspecified';
                optionOne.classList.add('truncate-150', 'color-grey');

                const optionTwo = document.createElement('option');
                optionTwo.innerText = 'Low';
                optionTwo.classList.add('truncate-150', 'color-pastel-blue');

                const optionThree = document.createElement('option');
                optionThree.innerText = 'Medium';
                optionThree.classList.add('truncate-150', 'color-light-orange');

                const optionFour = document.createElement('option');
                optionFour.innerText = 'High';
                optionFour.classList.add('truncate-150', 'color-bright-yellow');

                const optionFive = document.createElement('option');
                optionFive.innerText = 'Urgent';
                optionFive.classList.add('truncate-150', 'color-red');

                newInputField.innerText = optionOne;
                newInputField.style.minWidth = '200px';

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);

                newInputField.appendChild(optionOne);
                newInputField.appendChild(optionTwo);
                newInputField.appendChild(optionThree);
                newInputField.appendChild(optionFour);
                newInputField.appendChild(optionFive);

            } else if (header === 'due_date') {
                newInputField = document.createElement('input');
                newInputField.type = 'datetime-local';
                newInputField.className = 'form-control mb-3';
                newInputField.style.minWidth = '350px';
                newInputField.placeholder = 'Select date and time';

                flatpickr(newInputField, {
                    enableTime: true,
                    dateFormat: "Y-m-d\\TH:i",
                    minDate: "today",
                    theme: "dark",
                });

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);

            } else if (header === 'media') {
                newInputField = document.createElement('input');
                newInputField.type = 'file';
                newInputField.className = 'form-control mb-3';
                newInputField.style.minWidth = '350px';

                editContent.innerHTML = '';
                editContent.appendChild(newInputField);
            }

            newInputField.id = 'newInputField';

            const saveEditButton = document.createElement('button');
            saveEditButton.type = 'submit';
            saveEditButton.id = 'save-edit-btn';
            saveEditButton.className = 'btn btn-outline-primary';

            saveEditButton.textContent = 'Save changes';
            editContent.appendChild(saveEditButton);

            saveEditButton.addEventListener('click', () => {
                const csrf_token = document.querySelector('[name=csrfmiddlewaretoken]').value;

                if (newInputField && newInputField.files && newInputField.files[0]) {
                    const file = newInputField.files[0];
                    const reader = new FileReader();
    
                    reader.onload = (event) => {
                        const content = event.target.result;
    
                        const requestData = {
                            data_type: header,
                            content: content,
                            task_num: taskNumber
                        }
    
                        fetch(`/api.tasks/${project_id}`, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "multipart/form-data",
                                "X-CSRFToken": csrf_token
                            },
                            body: JSON.stringify(requestData)
                        })
                        .then(response => {
                            if (response.ok) {
                                load_tasks(project_id, project_title);
                            } else {
                                return response.json();
                            }
                        })
                        .then(data => {
                            if (data.error) {
                                data.error.forEach(message => {
                                displayError(message);
                                });
                            }
                        })
                        .catch(error => {
                            console.log('Error:', error);
                        });
                    };
                    reader.readAsDataURL(file);
                } else {
                    fetch(`/api.tasks/${project_id}`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrf_token
                        },
                        body: JSON.stringify({
                            data_type: header,
                            content: newInputField.value,
                            task_num: taskNumber,
                        })
                    })
                    .then(response => {
                        if (response.ok) {
                            load_tasks(project_id, project_title);
                        } else {
                            return response.json();
                        }
                    })
                    .then(data => {
                        if (data.error) {
                            data.error.forEach(message => {
                            displayError(message);
                            });
                        }
                    })
                    .catch(error => {
                        console.log('Error:', error);
                    });
                }

            });
            
        });

    }
}

function load_projects() {
    document.querySelector('#projects-view').style.display = 'block';
    document.querySelector('#tasks-view').style.display = 'none';
    document.querySelector('#newproject-view').style.display = 'none';
    document.querySelector('#edit-view').style.display = 'none';
    document.querySelector('#newtask-modal').style.display = 'none';

    fetch('/api.projects')
    .then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            document.querySelector('#create-proj-icon').style.display = 'block';
        } else {
            document.querySelector('#create-proj-exist-icon').style.display = 'block';
                
        }
            const listClearer = document.querySelector('#projects-view ul');
            listClearer.textContent = '';

            data.forEach(project => {
                const projectListItem = document.createElement('li');
                projectListItem.className = 'project-li';
                
                if (project !== undefined) {
                    projectListItem.innerHTML = `
                    <div id="proj-li-title" class="truncate-500">${project['title']}</div>
                    <div id="proj-li-date">${project['creation_date']}</div>`;
                }

                document.querySelector('#projects-view ul').appendChild(projectListItem);
                
                
                function listProjectItems() {
                    document.querySelector('#projects-view').style.display = 'none';
                    projectListItem.removeEventListener('click', listProjectItems);
                    load_tasks(project['id'], project['title']);
                }
                
                projectListItem.addEventListener('click', listProjectItems);
            });
    })
    .catch(error => {
        console.log('Error:', error)
    });
}

function new_project() {
    document.querySelector('#edit-view').style.display = 'none';
    document.querySelector('#newtask-modal').style.display = 'none';

    const newProjectDiv = document.querySelector('#newproject-view');
    newProjectDiv.style.display = 'block';
    setTimeout(() => {
        newProjectDiv.style.transform = "translateY(-40%) translateX(-20%)";
    }, 10);

}

function new_task() {
    document.querySelector('#projects-view').style.display = 'none';
    document.querySelector('#edit-view').style.display = 'none';
    document.querySelector('#newproject-view').style.display = 'none';

    const newTaskDiv = document.querySelector('#newtask-modal');
    newTaskDiv.style.display = 'block';
    setTimeout(() => {
        newTaskDiv.style.transform = "translateY(-40%) translateX(-20%)";
    }, 10);
}

function displayError(message) {
    const errorElement = document.querySelector('#content-err-msg');
    const ErrorMessage = document.createElement('li');

    if (message === 'Task with this Project, User and No. already exists.') {
        message = 'Task "No." already exists, please use a different one.';
    }
    ErrorMessage.style.animationPlayState = 'running';

    ErrorMessage.textContent = `Error: ${message}`;
    errorElement.appendChild(ErrorMessage);
    ErrorMessage.addEventListener('animationend', () => {
        errorElement.removeChild(ErrorMessage);
        
    });
}

function load_tasks(project_id, project_title) {
    document.querySelector('#projects-view').style.display = 'none';
    document.querySelector('#newproject-view').style.display = 'none';
    document.querySelector('#edit-view').style.display = 'none';
    document.querySelector('#newtask-modal').style.display = 'none';

    document.querySelector('#tasks-view').style.display = 'block';

    const selectMenu = document.querySelector('#tasks-view #new-task-project select');

    selectMenu.removeEventListener('change', selectMenuChange);
    function selectMenuChange(event) {
        const selectedOption = event.target.value;
        if (selectedOption === 'Project') {
            selectMenu.selectedIndex = 0;
            new_project();
        } else if (selectedOption === 'Task') {
            selectMenu.selectedIndex = 0;
            new_task();
        }
    }
    selectMenu.addEventListener('change', selectMenuChange);

    const projectTasksTitle = document.querySelector('#project-tasks-title');
    projectTasksTitle.value = '';

    projectTasksTitle.textContent = project_title;
    projectTasksTitle.dataset.projectid = project_id;

    const templateHeadElement = document.querySelector('#tasks-view #tasks-table table thead');
    const templateBodyElement = document.querySelector('#tasks-view #tasks-table table tbody');

    templateHeadElement.innerText = '';
    templateBodyElement.innerText = '';

    const tasksIcons = [
        '<i class="bi bi-hash"></i>', 
        '<i class="bi bi-journal-bookmark"></i>',
        '<i class="bi bi-journal-text"></i>',
        '<i class="bi bi-graph-up-arrow"></i>',
        '<i class="bi bi-layers"></i>',
        '<i class="bi bi-calendar2-day"></i>',
        '<i class="bi bi-file-earmark-break"></i>',
        '<i class="bi bi-stickies"></i>'
    ];
    let tasksCounter = 0;

    fetch(`/api.tasks/${project_id}`)
    .then(response => response.json())
    .then(data => {
        const tableHeaderRow = document.createElement('tr');
        templateHeadElement.appendChild(tableHeaderRow);
        const headers = data.verbose_names.slice(3); // exclude first two cols
        headers.forEach(header => {
            const tableHeaderData = document.createElement('th');
            tableHeaderData.innerHTML = `<span>${tasksIcons[tasksCounter]} </i>${header}</span>`;
            tasksCounter ++;
            tableHeaderRow.appendChild(tableHeaderData);
        });

        const tasks = data.tasks;
        tasks.forEach(task => {
            const tableBodyRow = document.createElement('tr');
            templateBodyElement.appendChild(tableBodyRow);
            
            Object.entries(task)
                .filter(([key]) => key !== 'id' && key !== 'project_id' && key !== 'user_id')
                .forEach(([key, value]) => {
                    const tableData = document.createElement('td');
                    tableData.textContent = value;
                    tableData.classList.add('truncate-150');
                    tableData.dataset.no = task.number;

                    if (key === 'due_date') {
                        if (new Date() > new Date(value)) {
                            tableData.textContent = `${value} (Past due)`;
                            tableData.classList.add('date-color-red');
                        }
                    }

                    if (key === 'title') {
                        tableData.classList.add('bold');
                    }

                    if (key === 'status') {
                        if (value === 'Undecided') {
                            tableData.classList.add('color-grey');
                        } else if (value === 'To Do') {
                            tableData.classList.add('color-blue');
                        } else if (value === 'In Progress') {
                            tableData.classList.add('color-orange');
                        } else if (value === 'Done') {
                            tableData.classList.add('color-green');
                        }
                    }
                    
                    if (key === 'priority') {
                        if (value === 'Unspecified') {
                            tableData.classList.add('color-grey');
                        } else if (value === 'Low') { 
                            tableData.classList.add('color-pastel-blue');
                        } else if (value === 'Medium') {
                            tableData.classList.add('color-light-orange');
                        } else if (value === 'High') {
                            tableData.classList.add('color-bright-yellow');
                        } else if (value === 'Urgent') {
                            tableData.classList.add('color-red');
                        }
                    }

                    if (key === 'media') {
                        if (value !== null) {
                            let imgPath = value;
                            let imgElement = `<img id="taskImage" src="${imgPath}">`;
                            tableData.innerHTML = imgElement;
                        }
                    }

                    if (tableData.innerHTML === "" || tableData.innerHTML === undefined) {
                        tableData.textContent = '---';
                        tableData.classList.add('color-grey');
                    }

                    tableData.addEventListener('click', () => {
                            edit_view(tableData.innerHTML, key, project_id, project_title, tableData.dataset.no);
                    });

                    tableBodyRow.appendChild(tableData);
            });
        });
    })
    .catch(error => {
        console.log('Error:', error);
    });

}

function isValidDateTimeFormat(dateTimeString) {
    var regex = /^\d{4}-((0[1-9])|(1[0-2]))-((0[1-9])|([12]\d)|(3[01]))T(([01]\d)|(2[0-3])):[0-5]\d$/;
    return regex.test(dateTimeString);
}


function createErrorMessage() {
    const errMsgField = document.querySelector('#err-msg');
    let errMsg = errMsgField.querySelector('.error-message');
    if (!errMsg) {
        errMsg = document.createElement('div');
        errMsg.classList.add('error-message');
        errMsg.style.fontWeight = 'bold';
        errMsgField.appendChild(errMsg);
    }
    errMsg.style.display = 'none';
    return errMsg;
}


function validateNumber(input) {
    const errMsg = createErrorMessage();
    if (parseInt(input.value) < 0 || isNaN(parseInt(input.value)) && input.value.trim()) {
        errMsg.style.display = 'block';
        errMsg.style.color = 'red';
        errMsg.innerText = 'Task number cannot be less than zero.';
        input.style.borderColor = 'red';
        return false;
    } else {
        errMsg.style.display = 'none';
        input.style.borderColor = '#7c7c7c91';
        return true;
    }
}

function validateLength(input, maxLength, errMsgText) {
    const errMsg = createErrorMessage();
    if (input.value.length > maxLength) {
        errMsg.style.display = 'block';
        errMsg.style.color = 'red';
        errMsg.innerText = errMsgText;
        input.style.borderColor = 'red';
        return false;
    } else {
        errMsg.style.display = 'none';
        input.style.borderColor = '#7c7c7c91';
        return true;
    }
};

function validateDropdown(select, validOptions, errMsgText) {
    const errMsg = createErrorMessage();
    const selectedOption = select.value;
    if (!validOptions.includes(selectedOption)) {
        errMsg.style.display = 'block';
        errMsg.style.color = 'red';
        errMsg.innerText = errMsgText;
        select.style.border = 'red';
        return false;
    } else {
        errMsg.style.display = 'none';
        select.style.borderColor = '#7c7c7c91';
        return true;
    }
};