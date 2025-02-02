from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

tasks = []
rejected_tasks = []

stages = {
    'idea_submission': [
        'Submitted',
        'Under Review (COO)',
        'Under Review (President)',
        'Under Review (CEO)',
        'Approved for Evaluation',
        'Rejected'
    ],
    'mvp_definition': [
        'Idea Defined (MVP & Wishlist)',
        'Images Uploaded',
        'Ready for Review Board',
        'Rejected'
    ],
    'resource_allocation': [
        'Under Review (COO, President, CEO)',
        'Resources Approved',
        'Deferred for Re-Evaluation',
        'Rejected'
    ],
    'cto_assignment': [
        'Reviewing',
        'Assigned to Development Group',
        'No-Code Development Start',
        'Rejected'
    ],
    'mvp_development': [
        'Acknowledged',
        'Work in Progress',
        'Shipped',
        'Rejected'
    ],
    'mvp_review': [
        'Sent for Review',
        'Under Review',
        'Accepted',
        'Rejected'
    ],
    'final_review': [
        'Under Review (COO, President, CEO)',
        'Approved for Production',
        'Requires Revisions',
        'Rejected'
    ],
    'final_development': [
        'Assigned (VP of Software Development)',
        'Backburner',
        'Work in Progress',
        'Testing',
        'Completed for Review',
        'Rejected'
    ],
    'final_cto_review': [
        'Backburner',
        'Under Review',
        'Rejected'
    ],
    'release_sales': [
        'Sent to Originator',
        'Sent to Sales Team',
        'Rejected'
    ]
}

@app.route('/')
def home():
    return render_template('home.html', stages=stages)

@app.route('/kanban/<stage>')
def kanban(stage):
    if stage not in stages:
        return "Stage not found", 404
    stage_tasks = [task for task in tasks if task.get('stage') == stage]
    return render_template('kanban.html', stage=stage, stages=stages[stage], tasks=stage_tasks)

@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks)

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.json
    task = {
        'id': len(tasks) + 1,
        'title': data['title'],
        'description': data['description'],
        'created_by': data.get('created_by', 'Anonymous'),
        'time_created': datetime.now().isoformat(),
        'time_modified': None,
        'modified_by': None,
        'mvp_list': data.get('mvp_list', []),
        'nice_to_have_list': data.get('nice_to_have_list', []),
        'images': data.get('images', []),
        'notes': data.get('notes', ''),
        'rejected_notes': [],
        'history_of_changes': [],
        'stage': data.get('stage', 'idea_submission'),
        'status': data.get('status', 'Submitted')
    }
    tasks.append(task)
    return jsonify(task), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    task = next((task for task in tasks if task['id'] == task_id), None)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404

    task['title'] = data['title']
    task['description'] = data['description']
    task['created_by'] = data['created_by']
    task['mvp_list'] = data['mvp_list']
    task['nice_to_have_list'] = data['nice_to_have_list']
    task['images'] = data['images']
    task['notes'] = data['notes']
    task['time_modified'] = datetime.now().isoformat()
    task['modified_by'] = data.get('modified_by', task['created_by'])
    task['stage'] = data.get('stage', task['stage'])
    task['status'] = data.get('status', task['status'])
    task['history_of_changes'].append({
        'action': 'Modified task',
        'time': task['time_modified'],
        'modified_by': task['modified_by']
    })

    return jsonify(task)

@app.route('/tasks/<int:task_id>/reject', methods=['PUT'])
def reject_task(task_id):
    task = next((task for task in tasks if task['id'] == task_id), None)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404

    tasks.remove(task)
    rejected_tasks.append(task)
    return jsonify(task)

@app.route('/rejected', methods=['GET'])
def view_rejected_tasks():
    return render_template('rejected.html', tasks=rejected_tasks)

@app.route('/tasks/<int:task_id>/unreject', methods=['PUT'])
def unreject_task(task_id):
    task = next((task for task in rejected_tasks if task['id'] == task_id), None)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404

    rejected_tasks.remove(task)
    tasks.append(task)
    return jsonify(task)

if __name__ == '__main__':
    app.run(debug=True)