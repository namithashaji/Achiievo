import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/config/firebaseConfig'; 
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';

interface LogEntry {
  description: string;
  timestamp: number;
}

interface UserDetails {
  username: string;
  points: number;
  logs: LogEntry[];
}

interface LeaderboardEntry {
  id: string;
  fullName: string;
  departmentName: string; // updated from collegeName to departmentName
  avatarUrl: string;
  points: number;
  sshr: number; // added SSHR field
  updatedAt: number; // Timestamp when the score was last updated
}

interface LeaderboardContextType {
  leaderboard: LeaderboardEntry[];
  userDetails: UserDetails | null;
  fetchUserDetails: (id: string) => void;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const REFRESH_THRESHOLD = 5;
const REFRESH_WINDOW = 30 * 1000; // 30 seconds

export const useLeaderboard = (): LeaderboardContextType => {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
};

export const LeaderboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    const now = Date.now();
    const cachedData = JSON.parse(localStorage.getItem('leaderboardCache') || 'null');
    const refreshCount = JSON.parse(localStorage.getItem('leaderboardRefreshCount') || '0');
    const lastRefreshTime = JSON.parse(localStorage.getItem('leaderboardLastRefreshTime') || '0');

    const newRefreshCount = now - lastRefreshTime < REFRESH_WINDOW ? refreshCount + 1 : 1;
    localStorage.setItem('leaderboardRefreshCount', JSON.stringify(newRefreshCount));
    localStorage.setItem('leaderboardLastRefreshTime', JSON.stringify(now));

    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY && newRefreshCount > REFRESH_THRESHOLD) {
      setLeaderboard(cachedData.leaderboard);
      return;
    }

    // Set up real-time listener for the leaderboard in students collection
    const fetchLeaderboard = () => {
      const q = query(
        collection(db, 'students'), // Fetch data from 'students' collection
        orderBy('points', 'desc'),
        orderBy('updatedAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const studentsData: LeaderboardEntry[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as Omit<LeaderboardEntry, 'id'>;
          return { id: doc.id, ...data };
        });

        setLeaderboard(studentsData);

        localStorage.setItem('leaderboardCache', JSON.stringify({
          leaderboard: studentsData,
          timestamp: Date.now(),
        }));
      }, (error) => {
        console.error('Error fetching leaderboard:', error);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchLeaderboard();

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchUserDetails = async (id: string) => {
    try {
      const cachedUserDetails = JSON.parse(localStorage.getItem(`userDetails_${id}`) || 'null');
      const now = Date.now();

      if (cachedUserDetails && now - cachedUserDetails.timestamp < CACHE_EXPIRY) {
        console.log('Using cached user details');
        setUserDetails(cachedUserDetails.details);
        return;
      }

      const userDoc = doc(db, 'students', id); // Fetch user details from 'students' collection
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const details = userSnapshot.data() as UserDetails;
        setUserDetails(details);

        localStorage.setItem(`userDetails_${id}`, JSON.stringify({
          details,
          timestamp: now,
        }));
      } else {
        console.log('User details not found in Firestore');
        setUserDetails(null);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserDetails(null);
    }
  };

  return (
    <LeaderboardContext.Provider value={{ leaderboard, fetchUserDetails, userDetails }}>
      {children}
    </LeaderboardContext.Provider>
  );
};
