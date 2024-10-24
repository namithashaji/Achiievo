import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Star, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "@/context/LeaderboardContext";

const rankIcons = [
  <Trophy key="trophy" className="h-6 w-6 text-yellow-500" />,
  <Medal key="medal" className="h-6 w-6 text-gray-400" />,
  <Award key="award" className="h-6 w-6 text-amber-600" />,
  <Star key="star" className="h-6 w-6 text-blue-500" />,
  <Crown key="crown" className="h-6 w-6 text-purple-500" />,
];

interface TopThreeCardProps {
  rank: number;
  user: {
    avatarUrl: string;
    fullName: string;
    departmentName: string;
    sshr: number;
    points: number;
  };
  icon: React.ReactNode;
}

const TopThreeCard: React.FC<TopThreeCardProps> = ({ rank, user, icon }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`flex flex-col items-center w-full sm:w-1/3 p-3 rounded-lg shadow-lg ${
      rank === 1
        ? "bg-gradient-to-b from-yellow-100 to-yellow-200"
        : rank === 2
        ? "bg-gradient-to-b from-gray-100 to-gray-200"
        : "bg-gradient-to-b from-amber-100 to-amber-400"
    }`}
    style={{ minWidth: "200px", maxWidth: "250px" }}
  >
    <div className="text-center mb-1">
      <span className="text-base font-bold">{rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"} Place</span>
    </div>
    <div className="flex flex-col items-center mb-2">
      {icon}
      <Avatar className="w-20 h-20 border-2 border-white mt-1">
        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
        <AvatarFallback>{user.fullName.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
      </Avatar>
      <span className="text-lg font-semibold mt-1">{user.fullName}</span>
      <span className="text-xs text-gray-600 text-center">{user.departmentName}</span>
    </div>
    <CardContent className="text-center p-0">
      <span className="text-lg font-bold">{user.points}</span>
    </CardContent>
  </motion.div>
);

export default function Leaderboard() {
  const { leaderboard } = useLeaderboard();
  const [visibleEntries, setVisibleEntries] = useState(10);

  const loadMore = () => {
    setVisibleEntries((prevEntries) => Math.min(prevEntries + 5, leaderboard.length));
  };

  return (
    <Card className="w-full max-w-6xl mx-auto overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-3xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          Department Toppers
        </CardTitle>
        <div className="flex flex-wrap justify-center gap-4 mb-6 px-4">
          {leaderboard.length >= 3 && (
            <>
              <TopThreeCard rank={2} user={leaderboard[1]} icon={rankIcons[1]} />
              <TopThreeCard rank={1} user={leaderboard[0]} icon={rankIcons[0]} />
              <TopThreeCard rank={3} user={leaderboard[2]} icon={rankIcons[2]} />
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow><TableHead className="w-16">Rank</TableHead><TableHead>SSHR</TableHead><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Department</TableHead><TableHead className="text-right">Score</TableHead></TableRow>
            </TableHeader>
            <TableBody className="px-1">
              <AnimatePresence>
                {leaderboard.slice(0, visibleEntries).map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    className={`transition-all ${
                      index < 5
                        ? `bg-opacity-20 ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-amber-600"
                              : index === 3
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }`
                        : ""
                    }`}
                  >
                    <TableCell className="font-medium py-4"><div className="flex items-center gap-2">{index < 5 ? rankIcons[index] : index + 1}</div></TableCell>
                    <TableCell className="py-4">{user.sshr}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                          <AvatarFallback>{user.fullName.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span className={index < 5 ? "text-lg font-semibold" : ""}>{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-4">{user.departmentName}</TableCell>
                    <TableCell className={`text-right font-semibold py-4 px-2 ${index < 5 ? "text-lg" : ""}`}>
                      {user.points}
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
        {visibleEntries < leaderboard.length && (
          <div className="mt-6 text-center">
            <Button
              onClick={loadMore}
              variant="outline"
              className="px-6 py-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              View More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
