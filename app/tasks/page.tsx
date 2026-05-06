"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
  };
  assigned_to_user: {
    name: string;
  } | null;
}

export default function TasksPage() {
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "done">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          projects (
            name
          ),
          assigned_to_user:users!tasks_assigned_to_fkey (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus } as unknown as never)
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
      } else {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Tasks</h1>
              <p className="text-blue-100 mt-1">
                Manage and track your tasks
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition"
              >
                Projects
              </Link>
              <Link
                href="/profile"
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              All Tasks ({tasks.length})
            </h2>
            <Link
              href="/tasks/create"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Create Task
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            {["all", "todo", "in-progress", "done"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl">Loading tasks...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">No tasks found</p>
              <Link
                href="/tasks/create"
                className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block"
              >
                Create your first task
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    task.status === "done"
                      ? "border-green-600"
                      : task.status === "in-progress"
                      ? "border-yellow-500"
                      : isOverdue(task.due_date)
                      ? "border-red-600"
                      : "border-blue-600"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/tasks/${task.id}`}>
                        <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition">
                          {task.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 mt-2">{task.description || "No description"}</p>
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {task.projects?.name || "No project"}
                        </span>
                        {task.assigned_to_user && (
                          <span>Assigned to: {task.assigned_to_user.name}</span>
                        )}
                        {task.due_date && (
                          <span className={isOverdue(task.due_date) ? "text-red-600 font-semibold" : ""}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
