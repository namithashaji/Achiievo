
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Leaderboard from '@/UI/Leaderboard'
import Navbar from '@/UI/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listenToTasks } from '@/services/firestoreService'
import { useInView } from 'react-intersection-observer'
import Footer from '@/UI/Footer'

interface Task {
  id: string
  title: string
  description: string
  deadline: string
  reward: number
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const REFRESH_THRESHOLD = 5;
const REFRESH_WINDOW = 30 * 1000; // 30 seconds

function useTasksWithOptimization() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const now = Date.now();
    const cachedData = JSON.parse(localStorage.getItem('tasksCache') || 'null');
    const refreshCount = JSON.parse(localStorage.getItem('refreshCount') || '0');
    const lastRefreshTime = JSON.parse(localStorage.getItem('lastRefreshTime') || '0');

    // Update refresh count
    const newRefreshCount = now - lastRefreshTime < REFRESH_WINDOW ? refreshCount + 1 : 1;
    localStorage.setItem('refreshCount', JSON.stringify(newRefreshCount));
    localStorage.setItem('lastRefreshTime', JSON.stringify(now));

    // Use cached data if it's fresh and we're over the refresh threshold
    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY && newRefreshCount > REFRESH_THRESHOLD) {
      setTasks(cachedData.tasks);
      return;
    }

    // Subscribe to Firebase updates
    const unsubscribe = listenToTasks((newTasks: Task[]) => {
      setTasks(newTasks);
      localStorage.setItem('tasksCache', JSON.stringify({ tasks: newTasks, timestamp: Date.now() }));
    });

    return () => unsubscribe();
  }, []);

  return tasks;
}

const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

function HomePage() {
  const [activeTab, setActiveTab] = useState("leaderboard")
  const tasks = useTasksWithOptimization();
  const [now, setNow] = useState(new Date())
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("default")

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { ref: leaderboardRef, inView: leaderboardInView } = useInView({ triggerOnce: true })
  const { ref: tasksRef, inView: tasksInView } = useInView({ triggerOnce: true })

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - now.getTime()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const isExpired = (deadline: string) => {
    return new Date(deadline).getTime() - now.getTime() <= 0
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    if (filter === "active") {
      filtered = tasks.filter(task => !isExpired(task.deadline))
    } else if (filter === "expired") {
      filtered = tasks.filter(task => isExpired(task.deadline))
    }

    if (sortBy === "points") {
      filtered.sort((a, b) => b.reward - a.reward)
    } else {
      // Default sorting: active tasks first, then by deadline
      filtered.sort((a, b) => {
        const aExpired = isExpired(a.deadline)
        const bExpired = isExpired(b.deadline)
        if (aExpired && !bExpired) return 1
        if (!aExpired && bExpired) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    }

    return filtered
  }, [tasks, filter, sortBy, now])

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="leaderboard" className='text-xl p-2'>Leaderboard</TabsTrigger>
            <TabsTrigger value="tasks" className='text-xl p-2'>Active Tasks</TabsTrigger>
          </TabsList>

          <motion.div
            key="leaderboard"
            ref={leaderboardRef}
            initial="hidden"
            animate={activeTab === 'leaderboard' && leaderboardInView ? "visible" : "hidden"}
            variants={tabVariants}
          >
            <TabsContent value="leaderboard">
              <Card>
                <CardContent className='mt-5'>
                  <Leaderboard />
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>

          <motion.div
            key="tasks"
            ref={tasksRef}
            initial="hidden"
            animate={activeTab === 'tasks' && tasksInView ? "visible" : "hidden"}
            variants={tabVariants}
          >
            <TabsContent value="tasks">
              <div className="flex justify-between mb-4">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter tasks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="active">Active Tasks</SelectItem>
                    <SelectItem value="expired">Expired Tasks</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Active First)</SelectItem>
                    <SelectItem value="points">Points (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedTasks.map((task) => {
                  const expired = isExpired(task.deadline)
                  return (
                    <Card 
                      key={task.id} 
                      className={`overflow-hidden ${expired ? 'bg-gray-100' : 'bg-white'}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <Badge variant={expired ? "outline" : "secondary"}>
                            {task.reward} pts
                          </Badge>
                        </div>
                        <CardDescription className={`text-xs ${expired ? 'text-red-500' : 'text-green-500'}`}>
                          {expired ? 'Expired' : `Time left: ${getTimeLeft(task.deadline)}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${expired ? 'text-gray-500' : 'text-gray-700'}`}>
                          {task.description}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </motion.div>
        </Tabs>
      </main>
      <Footer/>
    </div>
  )
}

export default HomePage