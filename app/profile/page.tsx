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
  projects: {
    name: string;
  };
}

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setProfilePicture(userData.profile_picture || "");
      fetchAssignedTasks();
    } else {
      setLoading(false);
    }
  }, [userData]);

  const fetchAssignedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects (
            name
          )
        `)
        .eq("assigned_to", user?.id)
        .order("created_at", { ascending: false });

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

  const handleUpdateProfilePicture = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("users")
        .update({ profile_picture: profilePicture })
        .eq("id", user?.id);

      if (error) {
        toast.error("Error updating profile picture: " + error.message);
      } else {
        toast.success("Profile picture updated successfully");
        setIsEditing(false);
        refreshUserData();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Error uploading file: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_picture: publicUrl })
        .eq("id", user?.id);

      if (updateError) {
        toast.error("Error updating profile: " + updateError.message);
      } else {
        toast.success("Profile picture uploaded successfully");
        setProfilePicture(publicUrl);
        setIsEditing(false);
        refreshUserData();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
              <Link href="/dashboard" className="text-blue-200 hover:text-white mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Profile</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mb-4">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-blue-600">
                        {userData?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    Change Profile Picture
                  </button>
                </div>

                {/* Profile Picture Edit Form */}
                {isEditing && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload from Computer
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black mb-2"
                    />
                    <p className="text-xs text-gray-500 mb-4">Max file size: 5MB (JPG, PNG, GIF)</p>

                    <div className="border-t border-gray-300 pt-4 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or enter image URL
                      </label>
                      <form onSubmit={handleUpdateProfilePicture}>
                        <input
                          type="url"
                          value={profilePicture}
                          onChange={(e) => setProfilePicture(e.target.value)}
                          placeholder="Enter image URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition text-sm disabled:opacity-50"
                          >
                            {uploading ? "Saving..." : "Save URL"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setProfilePicture(userData?.profile_picture || "");
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Name</h3>
                    <p className="text-lg font-semibold text-gray-800">{userData?.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Email</h3>
                    <p className="text-gray-800">{user?.email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Role</h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-lg font-semibold ${
                        userData?.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {userData?.role?.toUpperCase()}
                    </span>
                  </div>

                  {userData?.phone && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Phone</h3>
                      <p className="text-gray-800">{userData.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned Tasks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Assigned Tasks ({tasks.length})
                </h2>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-xl">Loading tasks...</div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No tasks assigned to you</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const getBorderColor = () => {
                        if (task.status === "done") return "border-green-600";
                        if (task.status === "in-progress") return "border-yellow-500";
                        if (task.due_date && isOverdue(task.due_date)) return "border-red-600";
                        return "border-blue-600";
                      };

                      return (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className={`block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border-l-4 ${getBorderColor()}`}
                        >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{task.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{task.description || "No description"}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                task.status === "todo" ? "bg-gray-200" :
                                task.status === "in-progress" ? "bg-yellow-100" :
                                "bg-green-100"
                              }`}>
                                {task.status}
                              </span>
                              <span>{task.projects?.name || "No project"}</span>
                              {task.due_date && (
                                <span className={isOverdue(task.due_date) ? "text-red-600 font-semibold" : ""}>
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
