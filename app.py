from flask import Flask, jsonify, request, render_template

from database import (
    get_all_tasks,
    get_task_by_id,
    create_task,
    update_task,
    delete_task,
    initialize_database,
    get_task_statistics,
    get_recent_tasks,
    get_filtered_tasks
)

app = Flask(__name__)

@app.route('/')
def home_page():
    return "Welcome to Home Page"


@app.route('/tasks')
def tasks_page():
    return render_template('index.html')


@app.route('/api/overview', methods=['GET'])
def get_overview():

    statistics = get_task_statistics()
    recent_tasks = get_recent_tasks(3)

    return jsonify({
        "statistics": statistics,
        "recent_tasks": recent_tasks
    }), 200

# Get all the tasks
@app.route('/api/tasks', methods=['GET'])
def get_tasks():

    title = request.args.get("title")
    status = request.args.get("status")
    date = request.args.get("date")

    tasks = get_filtered_tasks(
        title=title,
        status=status,
        date=date
    )

    return jsonify(tasks), 200



# Get a specific task using the task_id
@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task_using_id(task_id):

    task = get_task_by_id(task_id)

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    return jsonify(task), 200
    


# Create a new task
@app.route('/api/tasks', methods=['POST'])
def create_new_task():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    # Extract values
    title = data.get("title")
    description = data.get("description")
    status = data.get("status", "Pending")

    if not title or (isinstance(title, str) and not title.strip()):
        return jsonify({
            "error": "Title is required"
        }), 400

    if not description or (isinstance(description, str) and not description.strip()):
        return jsonify({
            "error": "Description is required"
        }), 400
    
    allowed_statuses = ["Pending", "In Progress", "Completed"]
    if status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status"
        }), 400

    task = create_task(
        title,
        description,
        status
    )
    return jsonify(task), 201

    


# Partially update a task
# Only title, description, and status can be updated
@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
def update_task_details(task_id):

    data = request.get_json(silent=True)

    # Check if request body exists
    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    # Allowed fields
    allowed_fields = ["title", "description", "status"]

    # Check for invalid fields
    invalid_fields = [
        field for field in data
        if field not in allowed_fields
    ]

    if invalid_fields:
        return jsonify({
            "error": "Invalid fields",
            "fields": invalid_fields
        }), 400

    # Validate title
    if "title" in data and (not data["title"] or (isinstance(data["title"], str) and not data["title"].strip())):
        return jsonify({
            "error": "Title cannot be empty"
        }), 400

    # Validate description
    if "description" in data and (not data["description"] or (isinstance(data["description"], str) and not data["description"].strip())):
        return jsonify({
            "error": "Description cannot be empty"
        }), 400

    # Validate status
    allowed_statuses = [
        "Pending",
        "In Progress",
        "Completed"
    ]

    if "status" in data and data["status"] not in allowed_statuses:
        return jsonify({
            "error": "Invalid status",
            "allowed_statuses": allowed_statuses
        }), 400

    # Update database
    task, error = update_task(task_id, data)

    if error == "No valid fields provided for update":
        return jsonify({
            "error": error
        }), 400

    if error == "Task not found":
        return jsonify({
            "error": error
        }), 404

    return jsonify(task), 200



# Delete a single task using the id
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def remove_task(task_id):
    
    deleted = delete_task(task_id)

    if not deleted:
        return jsonify({
            "error": "Task not found"
        }), 404
    
    return jsonify({
        "message": "Task deleted successfully",
        "id": task_id
    }), 200

    
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "error": "Bad request"
    }), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        "error": "Internal server error"
    }), 500


if __name__ == "__main__":
    initialize_database()
    app.run(debug=True)