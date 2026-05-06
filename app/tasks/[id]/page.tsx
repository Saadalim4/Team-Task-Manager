"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  created_at: string;
  projects: {
    name: string;
    id: string;
  };
  assigned_to_user: {
    name: string;
    id: string;
  } | null;
}

interface User {
  id: string;
  name: string;
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { userData } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    status: "",
    due_date: "",
    assigned_to: "",
  });

  useEffect(() => {
    fetchTaskDetails();
    fetchUsers();
  }, [params.id]);

  const fetchTaskDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects (
            name,
            id
          ),
          assigned_to_user:users!tasks_assigned_to_fkey (
            name,
            id
          )
        `)
        .eq("id", params.id)
        .single();

      if (error) {
        toast.error("Task not found");
        router.push("/tasks");
        return;
      }
      const taskData = data as { status: string; due_date: string; assigned_to: string };
      setTask(data);
      setEditedTask({
        status: taskData.status,
        due_date: taskData.due_date ? taskData.due_date.split("T")[0] : "",
        assigned_to: taskData.assigned_to || "",
      });
    } catch (error) {
      console.error("Error fetching task details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from("users").select("id, name").order("name");
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: editedTask.status,
          due_date: editedTask.due_date || null,
          assigned_to: editedTask.assigned_to || null,
        } as unknown as never)
        .eq("id", params.id);

      if (error) {
        toast.error("Error updating task: " + error.message);
      } else {
        toast.success("Task updated successfully");
        setIsEditing(false);
        fetchTaskDetails();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", params.id);

      if (error) {
        toast.error("Error deleting task: " + error.message);
      } else {
        toast.success("Task deleted successfully");
        router.push("/tasks");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const isOverdue = task?.due_date && new Date(task.due_date) < new Date();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <Link href="/tasks" className="text-blue-200 hover:text-white mb-2 inline-block">
                ← Back to Tasks
              </Link>
              <h1 className="text-3xl font-bold">{task?.title}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-8">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editedTask.status}
                    onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editedTask.due_date}
                    onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={editedTask.assigned_to}
                    onChange={(e) => setEditedTask({ ...editedTask, assigned_to: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
                  <p className="text-gray-800 text-lg">{task?.description || "No description"}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Status</h3>
                    <span
                      className={`px-3 py-1 rounded-lg font-semibold ${
                        task?.status === "done"
                          ? "bg-green-100 text-green-800"
                          : task?.status === "in-progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task?.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Due Date</h3>
                    <p className={isOverdue ? "text-red-600 font-semibold" : "text-gray-800"}>
                      {task?.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                      {isOverdue && " (Overdue)"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Project</h3>
                    <Link
                      href={`/projects/${task?.projects.id}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      {task?.projects.name}
                    </Link>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Assigned To</h3>
                    <p className="text-gray-800">{task?.assigned_to_user?.name || "Unassigned"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Created</h3>
                    <p className="text-gray-800">
                      {task?.created_at ? new Date(task.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
