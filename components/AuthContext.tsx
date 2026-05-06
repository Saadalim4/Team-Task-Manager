"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

interface UserData {
  id: string;
  name: string;
  role: "admin" | "member";
  phone: string | null;
  profile_picture: string | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If user doesn't exist, create them
        if (error.code === "PGRST116") {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user?.email) {
            // Check if this is the first user to determine role
            const { data: existingUsers } = await supabase
              .from("users")
              .select("id")
              .limit(1);

            const isFirstUser = !existingUsers || existingUsers.length === 0;
            const role = isFirstUser ? "admin" : "member";

            const { error: insertError } = await supabase
              .from("users")
              .insert([
                {
                  id: userId,
                  name: authUser.user.user_metadata?.name || authUser.user.email?.split("@")[0],
                  email: authUser.user.email,
                  role,
                },
              ]);

            if (insertError) {
              console.error("Error creating user data:", insertError);
            } else {
              // Fetch the newly created user data
              const { data: newData } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();
              setUserData(newData);
            }
          }
        } else {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
