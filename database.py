import sqlite3
from datetime import datetime

DATABASE = "tasks.db"

def get_connection():
    return sqlite3.connect(DATABASE)

def initialize_database():
    conn = get_connection()
    cursor = conn.cursor()


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks(
        id INTEGER PRIMARY KEY,
        title TEXT,
        description TEXT,
        status TEXT,
        created_at TEXT
        )
    """)

    conn.commit()
    conn.close()



def get_all_tasks():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks")
    tasks = cursor.fetchall()

    conn.close()
    result = []
    for task in tasks:
        result.append({
            "id": task[0],
            "title": task[1],
            "description": task[2],
            "status": task[3],
            "created_at": task[4]
        })
    return result


def get_task_statistics():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM tasks")
    total = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE LOWER(status) = 'pending'
    """)
    pending = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE LOWER(status) = 'completed'
    """)
    completed = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM tasks
        WHERE LOWER(status) = 'in progress'
    """)
    in_progress = cursor.fetchone()[0]

    conn.close()

    return {
        "total": total,
        "pending": pending,
        "completed": completed,
        "in_progress": in_progress
    }


def get_recent_tasks(limit=3):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM tasks
        ORDER BY datetime(created_at) DESC
        LIMIT ?
    """, (limit,))

    tasks = cursor.fetchall()
    conn.close()

    result = []

    for task in tasks:
        result.append({
            "id": task[0],
            "title": task[1],
            "description": task[2],
            "status": task[3],
            "created_at": task[4]
        })

    return result


def get_filtered_tasks(title=None, status=None, date=None):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT *
        FROM tasks
        WHERE 1=1
    """

    values = []

    if title:
        query += " AND title LIKE ?"
        values.append(f"%{title}%")

    if status:
        query += " AND LOWER(status) = LOWER(?)"
        values.append(status)

    if date:
        query += " AND DATE(created_at) = DATE(?)"
        values.append(date)

    query += " ORDER BY datetime(created_at) DESC"

    cursor.execute(query, values)

    tasks = cursor.fetchall()
    conn.close()

    result = []

    for task in tasks:
        result.append({
            "id": task[0],
            "title": task[1],
            "description": task[2],
            "status": task[3],
            "created_at": task[4]
        })

    return result




def get_task_by_id(task_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM tasks
        WHERE id = ?""",
        (task_id,)
    )
    task = cursor.fetchone()
    conn.close()

    if task is None:
        return None

    return {
        "id": task[0],
        "title": task[1],
        "description": task[2],
        "status": task[3],
        "created_at": task[4]
    }


def create_task(title, description, status):
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute("""
            INSERT INTO tasks (
            title,
            description,
            status,created_at
            ) 
            VALUES (?,?,?,?)
        """,(title, description, status, created_at)
        )

    conn.commit()
    # get the id of the newly created task
    task_id = cursor.lastrowid

    conn.close()

    return {
        "id" : task_id,
        "title" : title,
        "description" : description,
        "status" : status,
        "created_at": created_at
    }



def update_task(task_id, data):
    # Allowed fields that can be updated
    allowed_fields = ["title", "description", "status"]

    fields = []
    values = []

    # check which fields were provided
    for field in allowed_fields:
        if field in data:
            fields.append(f"{field} = ?")
            values.append(data[field])

    # Nothing to update
    if not fields:
        return None, "No valid fields provided for update"

    # Add task ID for WHERE condition
    values.append(task_id)

    conn = get_connection()
    cursor = conn.cursor()

    # Build UPDATE query
    query = f"""
        UPDATE tasks
        SET {", ".join(fields)}
        WHERE id = ?
    """
    cursor.execute(query, values)

    # check if task exists
    if cursor.rowcount == 0:
        conn.close()
        return None, "Task not found"
        

    conn.commit()

    # get updated task
    cursor.execute(
        "SELECT * FROM tasks WHERE id = ?",
        (task_id,)
    )

    task = cursor.fetchone()
    conn.close()
    return {
        "id": task[0],
        "title": task[1],
        "description": task[2],
        "status": task[3],
        "created_at": task[4]
    }, None


def delete_task(task_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM tasks
        WHERE id = ?
        """,(task_id,)
    )

    # check whether the task existed
    if cursor.rowcount == 0:
        conn.close()
        return False

    conn.commit()
    conn.close()

    return True


