"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "@/hooks/useUser";
import toast from "react-hot-toast";

const Profile = () => {
  const supabaseClient = useSupabaseClient();
  const { user } = useUser();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    avatar_url: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("playlists");

  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('username, email, avatar_url, bio')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Error fetching profile");
        } else {
          setProfile(data);
        }
      } else {
        console.warn("User is not logged in.");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, supabaseClient]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    let avatar_url = profile.avatar_url;

    if (file) {
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(`public/${user.id}`, file, {
          cacheControl: '3600',
          upsert: true // Replace if the file already exists
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast.error("Error uploading image");
        return;
      }

      // Construct the public URL for the uploaded avatar
      avatar_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/public/${user.id}`;
    }

    const { error } = await supabaseClient
      .from('profiles')
      .update({
        username: profile.username,
        email: profile.email,
        avatar_url,
        bio: profile.bio,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } else {
      setProfile((prev) => ({ ...prev, avatar_url }));
      toast.success("Profile updated successfully!");
      if (file) {
        setFile(null);
      }
    }
  };

  // Handle file change for avatar upload
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-gray-900 h-64"></div>
        <div className="flex items-center justify-center relative h-64">
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt="Avatar"
            className="w-32 h-32 rounded-full border-4 border-white object-cover"
          />
        </div>
      </div>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mt-4">{profile.username}</h1>
        <p className="text-center text-gray-300 mt-2">{profile.bio}</p>
        
        <div className="flex justify-center mt-4">
          
          
          <button 
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg transition ${activeTab === "settings" ? "bg-green-500 text-white" : "bg-gray-800 text-gray-300"}`}>
            Settings
          </button>
          <button 
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-lg transition ${activeTab === "playlists" ? "bg-green-500 text-white" : "bg-gray-800 text-gray-300"}`}>
            Playlists
          </button>
          <button 
            onClick={() => setActiveTab("favorites")}
            className={`px-4 py-2 rounded-lg transition ${activeTab === "favorites" ? "bg-green-500 text-white" : "bg-gray-800 text-gray-300"}`}>
            Favorites
          </button>
        </div>

        {activeTab === "playlists" && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Your Playlists</h2>
            {/* Add code to display playlists */}
          </div>
        )}
        
        {activeTab === "favorites" && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Your Favorite Songs</h2>
            {/* Add code to display favorite songs */}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Profile Settings</h2>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="block mb-2"
              />
              <div>
                <label className="block text-gray-300">Username:</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="mt-1 p-2 bg-gray-800 rounded transition focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300">Email:</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 p-2 bg-gray-800 rounded transition focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300">Bio:</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="mt-1 p-2 bg-gray-800 rounded transition focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
              </div>
              <button
                type="submit"
                className="mt-4 p-2 bg-green-600 rounded hover:bg-green-700 transition"
              >
                Update Profile
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
