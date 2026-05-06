"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { userData } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
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
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-blue-100 mt-1">
                Manage your projects and teams
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

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              All Projects ({projects.length})
            </h2>
            <Link
              href="/projects/create"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Create Project
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">No projects found</p>
              {userData?.role === "admin" && (
                <Link
                  href="/projects/create"
                  className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block"
                >
                  Create your first project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-600"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {project.description || "No description"}
                  </p>
                  <div className="text-sm text-gray-400">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
