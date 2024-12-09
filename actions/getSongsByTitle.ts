import { Song } from "@/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers"
import getSongs from "./getSongs";

//* Fetch song data 
const getSongsByTitle = async (title: string): Promise<Song[]> => {
    //* Create a Supabase client for server-side usage, passing cookies for session handling
    const supabase = createServerComponentClient({
        cookies: cookies
    });

    if (!title) {
        const allSongs = await getSongs();
        return allSongs;
    }

    //* Make a request to fetch all records from the 'songs' table, ordered by creation date
    const {data, error} = await supabase 
    .from('songs')
    .select('*')
    .ilike('title', `%${title}%`)
    .order('created_at', {ascending: false});

    if (error) {
       console.log(error) 
    }

    return (data as any) || [];
}

export default getSongsByTitle;