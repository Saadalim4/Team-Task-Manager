"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  users: {
    name: string;
    email: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string;
  assigned_to: string | null;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { userData } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");

  useEffect(() => {
    fetchProjectDetails();
  }, [params.id]);

  const fetchProjectDetails = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .single();

      if (projectError) {
        toast.error("Project not found");
        router.push("/projects");
        return;
      }
      setProject(projectData);

      // Fetch members
      const { data: membersData } = await supabase
        .from("project_members")
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .eq("project_id", params.id);

      setMembers(membersData || []);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching project details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail) return;

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", memberEmail)
        .single();

      if (userError || !userData) {
        toast.error("User not found with this email");
        return;
      }

      // Add member to project
      const { error: addError } = await supabase.from("project_members").insert([
        {
          project_id: params.id,
          user_id: userData.id,
          role: "member",
        },
      ]);

      if (addError) {
        toast.error("Error adding member: " + addError.message);
      } else {
        toast.success("Member added successfully");
        setMemberEmail("");
        setShowAddMember(false);
        fetchProjectDetails();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) {
        toast.error("Error removing member: " + error.message);
      } else {
        toast.success("Member removed successfully");
        fetchProjectDetails();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", params.id);

      if (error) {
        toast.error("Error deleting project: " + error.message);
      } else {
        toast.success("Project deleted successfully");
        router.push("/projects");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

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
              <Link href="/projects" className="text-blue-200 hover:text-white mb-2 inline-block">
                ← Back to Projects
              </Link>
              <h1 className="text-3xl font-bold">{project?.name}</h1>
              <p className="text-blue-100 mt-1">{project?.description || "No description"}</p>
            </div>
            {userData?.role === "admin" && (
              <button
                onClick={handleDeleteProject}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                Delete Project
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Members Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Members ({members.length})</h2>
                  {userData?.role === "admin" && (
                    <button
                      onClick={() => setShowAddMember(!showAddMember)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition"
                    >
                      Add Member
                    </button>
                  )}
                </div>

                {showAddMember && userData?.role === "admin" && (
                  <form onSubmit={handleAddMember} className="mb-4">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="Enter user email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-black mb-2"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition text-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{member.users.name}</p>
                        <p className="text-sm text-gray-500">{member.users.email}</p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {member.role}
                        </span>
                      </div>
                      {userData?.role === "admin" && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No members yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Tasks ({tasks.length})</h2>
                  <Link
                    href={`/tasks/create?project=${params.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition"
                  >
                    Create Task
                  </Link>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border-l-4 border-blue-600"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded ${
                              task.status === "todo" ? "bg-gray-200" :
                              task.status === "in-progress" ? "bg-yellow-100" :
                              "bg-green-100"
                            }`}>
                              {task.status}
                            </span>
                            {task.due_date && (
                              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No tasks yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
