"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
}

export default function Dashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    doneTasks: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total projects
      const { count: projectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      // Get total tasks
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      // Get tasks by status
      const { count: todoCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "todo");

      const { count: inProgressCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "in-progress");

      const { count: doneCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "done");

      // Get overdue tasks
      const { count: overdueCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("due_date", new Date().toISOString())
        .neq("status", "done");

      setStats({
        totalProjects: projectsCount || 0,
        totalTasks: tasksCount || 0,
        todoTasks: todoCount || 0,
        inProgressTasks: inProgressCount || 0,
        doneTasks: doneCount || 0,
        overdueTasks: overdueCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Welcome back, {userData?.name || "User"} ({userData?.role})
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/projects"
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition"
              >
                Projects
              </Link>
              <Link
                href="/tasks"
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition"
              >
                Tasks
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

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl">Loading dashboard...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Projects */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                <h3 className="text-gray-500 text-sm font-semibold uppercase">
                  Total Projects
                </h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.totalProjects}
                </p>
              </div>

              {/* Total Tasks */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
                <h3 className="text-gray-500 text-sm font-semibold uppercase">
                  Total Tasks
                </h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.totalTasks}
                </p>
              </div>

              {/* Overdue Tasks */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
                <h3 className="text-gray-500 text-sm font-semibold uppercase">
                  Overdue Tasks
                </h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.overdueTasks}
                </p>
              </div>

              {/* Todo Tasks */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
                <h3 className="text-gray-500 text-sm font-semibold uppercase">
                  To Do
                </h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.todoTasks}
                </p>
              </div>

              {/* In Progress Tasks */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <h3 className="text-gray-500 text-sm font-semibold uppercase">
                  In Progress
                </h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.inProgressTasks}
                </p>
              </div>

              {/* Done Tasks */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-gray-500 text-sm font-semibold uppercase">
                  Completed
                </h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {stats.doneTasks}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/projects/create"
                className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-md transition flex items-center justify-center"
              >
                <span className="text-xl font-semibold">Create New Project</span>
              </Link>
              <Link
                href="/tasks/create"
                className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-md transition flex items-center justify-center"
              >
                <span className="text-xl font-semibold">Create New Task</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
