import { User } from "@supabase/auth-helpers-nextjs";
import { createContext, useState, useEffect, useContext } from "react";
import { Subscription, UserDetails } from "@/types";
import { useSessionContext, useUser as useSupaUser } from "@supabase/auth-helpers-react";

// Define the UserContext type
type UserContextType = {
  accessToken: string | null;
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  subscription: Subscription | null;
};

// Create the UserContext
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the props type for the provider
export interface Props {
  [propName: string]: any;
}

// Define the MyUserContextProvider component
export const MyUserContextProvider = (props: Props) => {
  // Destructure the session context
  const { session, isLoading: isLoadingUser, supabaseClient: supabase } = useSessionContext();
  const user = useSupaUser();
  const accessToken = session?.access_token ?? null;

  // Initialize state for user details and subscription
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Define functions to fetch user details and subscription
  const getUserDetails = async () => {
    const { data, error } = await supabase.from('users').select('*').single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  };

  const getSubscription = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  };

  // Use effect to fetch user details and subscription when the user is available
  useEffect(() => {
    if (user && !isLoadingData && !userDetails && !subscription) {
      setIsLoadingData(true);

      Promise.allSettled([getUserDetails(), getSubscription()]).then((results) => {
        const userDetailsPromise = results[0];
        const subscriptionPromise = results[1];

        if (userDetailsPromise.status === "fulfilled") {
          setUserDetails(userDetailsPromise.value as UserDetails);
        }

        if (subscriptionPromise.status === "fulfilled") {
          setSubscription(subscriptionPromise.value as Subscription);
        }

        setIsLoadingData(false);
      });
    } else if (!user && !isLoadingData) {
      setUserDetails(null);
      setSubscription(null);
    }
  }, [user, isLoadingUser]);

  // Define the context value
  const value = {
    accessToken,
    user,
    userDetails,
    isLoading: isLoadingUser || isLoadingData,
    subscription,
  };

  // Return the context provider
  return <UserContext.Provider value={value} {...props} />;
};

// Define the useUser hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a MyUserContextProvider');
  }
  return context;
};