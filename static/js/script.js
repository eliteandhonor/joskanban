document.addEventListener('DOMContentLoaded', function () {
    // Initialize SortableJS for each Kanban column
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban', // Set the same group to allow drag-and-drop between columns
            animation: 150,
            onEnd: function (evt) {
                // Handle the end of the drag-and-drop event
                const item = evt.item;
                const fromColumn = evt.from;
                const toColumn = evt.to;
                console.log(`Moved item from column ${fromColumn.dataset.id} to column ${toColumn.dataset.id}`);
            }
        });
    });

    // Function to open a modal
    function openModal(title, content, taskId = null) {
        const modalHtml = `
            <div class="modal fade" id="kanbanModal" tabindex="-1" role="dialog" aria-labelledby="kanbanModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="kanbanModalLabel">${title}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="saveTaskButton" data-task-id="${taskId}">Save Task</button>
                            ${taskId ? `<button type="button" class="btn btn-danger" id="rejectTaskButton" data-task-id="${taskId}">Reject Task</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        $('#kanbanModal').modal('show');
        $('#kanbanModal').on('hidden.bs.modal', function () {
            document.getElementById('kanbanModal').remove();
        });
    }

    // Event listener for the "Add Task" button
    document.getElementById('addTaskButton').addEventListener('click', function () {
        const modalContent = `
            <form id="taskForm">
                <div class="form-group">
                    <label for="taskTitle">Title</label>
                    <input type="text" class="form-control" id="taskTitle" required>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea class="form-control" id="taskDescription" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="createdBy">Created By</label>
                    <input type="text" class="form-control" id="createdBy" value="Anonymous" required>
                </div>
                <div class="form-group">
                    <label for="mvpList">MVP List (comma separated)</label>
                    <input type="text" class="form-control" id="mvpList">
                </div>
                <div class="form-group">
                    <label for="niceToHaveList">Nice to Have List (comma separated)</label>
                    <input type="text" class="form-control" id="niceToHaveList">
                </div>
                <div class="form-group">
                    <label for="images">Images (comma separated URLs)</label>
                    <input type="text" class="form-control" id="images">
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea class="form-control" id="notes" rows="3"></textarea>
                </div>
            </form>
        `;
        openModal('Add Task', modalContent);

        document.getElementById('saveTaskButton').addEventListener('click', function () {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const createdBy = document.getElementById('createdBy').value;
            const mvpList = document.getElementById('mvpList').value.split(',').map(item => item.trim());
            const niceToHaveList = document.getElementById('niceToHaveList').value.split(',').map(item => item.trim());
            const images = document.getElementById('images').value.split(',').map(item => item.trim());
            const notes = document.getElementById('notes').value;
            if (title && description && createdBy) {
                const task = { title, description, created_by: createdBy, mvp_list: mvpList, nice_to_have_list: niceToHaveList, images, notes };
                saveTask(task);
                $('#kanbanModal').modal('hide');
            }
        });
    });

    // Function to save task to the server
    function saveTask(task) {
        fetch('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        })
        .then(response => response.json())
        .then(data => {
            addTaskToBoard(data);
        })
        .catch(error => console.error('Error:', error));
    }

    // Function to update task on the server
    function updateTask(task, taskId) {
        fetch(`/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        })
        .then(response => response.json())
        .then(data => {
            // Update the task on the board
            const taskCard = document.querySelector(`.kanban-card[data-task-id="${taskId}"]`);
            taskCard.querySelector('.kanban-card-title').textContent = data.title;
            taskCard.querySelector('.kanban-card-description').textContent = data.description;
        })
        .catch(error => console.error('Error:', error));
    }

    // Function to reject task on the server
    function rejectTask(taskId) {
        fetch(`/tasks/${taskId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Remove the task from the board
            const taskCard = document.querySelector(`.kanban-card[data-task-id="${taskId}"]`);
            taskCard.remove();
        })
        .catch(error => console.error('Error:', error));
    }

    // Function to add task to the Kanban board
    function addTaskToBoard(task) {
        const firstColumn = document.querySelector('.kanban-column[data-id="1"]');
        const taskHtml = `
            <div class="kanban-card" data-task-id="${task.id}">
                <div class="kanban-card-title">${task.title}</div>
                <div class="kanban-card-description">${task.description}</div>
            </div>
        `;
        firstColumn.insertAdjacentHTML('beforeend', taskHtml);

        // Add click event listener to the task card
        const taskCard = firstColumn.querySelector(`.kanban-card[data-task-id="${task.id}"]`);
        taskCard.addEventListener('click', function () {
            openEditModal(task);
        });
    }

    // Function to open the edit modal with task data
    function openEditModal(task) {
        const modalContent = `
            <form id="taskForm">
                <div class="form-group">
                    <label for="taskTitle">Title</label>
                    <input type="text" class="form-control" id="taskTitle" value="${task.title}" required>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea class="form-control" id="taskDescription" rows="3" required>${task.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="createdBy">Created By</label>
                    <input type="text" class="form-control" id="createdBy" value="${task.created_by}" required>
                </div>
                <div class="form-group">
                    <label for="mvpList">MVP List (comma separated)</label>
                    <input type="text" class="form-control" id="mvpList" value="${task.mvp_list.join(', ')}">
                </div>
                <div class="form-group">
                    <label for="niceToHaveList">Nice to Have List (comma separated)</label>
                    <input type="text" class="form-control" id="niceToHaveList" value="${task.nice_to_have_list.join(', ')}">
                </div>
                <div class="form-group">
                    <label for="images">Images (comma separated URLs)</label>
                    <input type="text" class="form-control" id="images" value="${task.images.join(', ')}">
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea class="form-control" id="notes" rows="3">${task.notes}</textarea>
                </div>
            </form>
        `;
        openModal('Edit Task', modalContent, task.id);

        document.getElementById('saveTaskButton').addEventListener('click', function () {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const createdBy = document.getElementById('createdBy').value;
            const mvpList = document.getElementById('mvpList').value.split(',').map(item => item.trim());
            const niceToHaveList = document.getElementById('niceToHaveList').value.split(',').map(item => item.trim());
            const images = document.getElementById('images').value.split(',').map(item => item.trim());
            const notes = document.getElementById('notes').value;
            if (title && description && createdBy) {
                const updatedTask = { title, description, created_by: createdBy, mvp_list: mvpList, nice_to_have_list: niceToHaveList, images, notes };
                updateTask(updatedTask, task.id);
                $('#kanbanModal').modal('hide');
            }
        });

        document.getElementById('rejectTaskButton').addEventListener('click', function () {
            rejectTask(task.id);
            $('#kanbanModal').modal('hide');
        });
    }

    // Load tasks from the server on page load
    function loadTasks() {
        fetch('/tasks')
        .then(response => response.json())
        .then(data => {
            data.forEach(task => addTaskToBoard(task));
        })
        .catch(error => console.error('Error:', error));
    }

    loadTasks();
});