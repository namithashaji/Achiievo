
import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { X, Edit, Trash2, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addTask, addStudent, updatePoints, deleteTask, deleteStudent, updateTask, updateStudent, listenToStudents, listenToTasks, getStudents } from '../services/firestoreService'
import { Timestamp } from 'firebase/firestore'
import { useTheme } from '@/context/ThemeContext'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js'
import * as XLSX from 'xlsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminNavbar from '@/UI/AdminNavbar'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement)

enum FormType {
  None,
  Task,
  Student,
  Points
}

type Student = {
  id: string;
  fullName: string;
  departmentName: string;
  sshr: number;
  avatarUrl: string;
  points: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  reward: number;
  status: string;
}

const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function EnhancedAdminDashboard() {
  const [activeForm, setActiveForm] = useState<FormType>(FormType.None)
  const [activeTab, setActiveTab] = useState("overview")
  const [students, setStudents] = useState<Student[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'students' | 'tasks'>('all')

  const { theme } = useTheme()

  useEffect(() => {
    const unsubscribeStudents = listenToStudents((newStudents) => {
      setStudents(newStudents as Student[])
    })
    const unsubscribeTasks = listenToTasks((newTasks) => {
      setTasks(newTasks as Task[])
    })
    return () => {
      unsubscribeStudents()
      unsubscribeTasks()
    }
  }, [])

  const filteredData = useMemo(() => {
    const lowercaseSearchTerm = searchTerm.toLowerCase()
    let filteredStudents = students
    let filteredTasks = tasks

    if (searchTerm) {
      filteredStudents = students.filter(student =>
        student.fullName.toLowerCase().includes(lowercaseSearchTerm) ||
        student.departmentName.toLowerCase().includes(lowercaseSearchTerm) ||
        student.sshr.toString().includes(lowercaseSearchTerm)
      )
      filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(lowercaseSearchTerm) ||
        task.description.toLowerCase().includes(lowercaseSearchTerm)
      )
    }

    if (filterType === 'students') return { students: filteredStudents, tasks: [] }
    if (filterType === 'tasks') return { students: [], tasks: filteredTasks }
    return { students: filteredStudents, tasks: filteredTasks }
  }, [students, tasks, searchTerm, filterType])

  const closeForm = () => {
    setActiveForm(FormType.None)
    setEditTask(null)
    setEditStudent(null)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    closeForm()
  }

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const task = {
      title: formData.get('task-title') as string,
      description: formData.get('task-description') as string,
      deadline: formData.get('task-deadline') as string,
      reward: parseInt(formData.get('task-reward') as string, 10) || 0,
      status: 'pending'
    }
    await addTask(task)
    closeForm()
  }

  const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editTask) {
      const formData = new FormData(event.currentTarget)
      const updatedTask = {
        title: formData.get('task-title') as string,
        description: formData.get('task-description') as string,
        deadline: formData.get('task-deadline') as string,
        reward: parseInt(formData.get('task-reward') as string, 10) || 0,
        status: editTask.status
      }
      await updateTask(editTask.id, updatedTask)
      closeForm()
    }
  }

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const student = {
      fullName: formData.get('student-fullname') as string,
      departmentName: formData.get('student-department') as string,
      sshr: parseInt(formData.get('student-sshr') as string, 10),
      avatarUrl: formData.get('student-avatar') as string,
      points: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    await addStudent(student)
    closeForm()
  }

  const handleUpdateStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editStudent) {
      const formData = new FormData(event.currentTarget)
      const updatedStudent = {
        fullName: formData.get('student-fullname') as string,
        departmentName: formData.get('student-department') as string,
        sshr: parseInt(formData.get('student-sshr') as string, 10),
        avatarUrl: formData.get('student-avatar') as string,
        updatedAt: Timestamp.now()
      }
      await updateStudent(editStudent.id, updatedStudent)
      closeForm()
    }
  }

  const handleAddPoints = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const pointsToAdd = parseInt(formData.get('points-to-add') as string, 10)
  
    if (selectedStudentId && !isNaN(pointsToAdd) && pointsToAdd > 0) {
      try {
        const students = await getStudents()
        const student = students.find((stu) => stu.id === selectedStudentId)
  
        if (student) {
          const newPoints = student.points + pointsToAdd
          await updatePoints(selectedStudentId, newPoints)
          closeForm()
        }
      } catch (error) {
        console.error('Error updating points:', error)
      }
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id)
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()
    
    const studentsWS = XLSX.utils.json_to_sheet(students.map(s => ({
      ...s,
      createdAt: s.createdAt.toDate().toLocaleString(),
      updatedAt: s.updatedAt.toDate().toLocaleString()
    })))
    XLSX.utils.book_append_sheet(workbook, studentsWS, "Students")

    const tasksWS = XLSX.utils.json_to_sheet(tasks)
    XLSX.utils.book_append_sheet(workbook, tasksWS, "Tasks")

    XLSX.writeFile(workbook, "admin_dashboard_data.xlsx")
  }

  const departmentData = useMemo(() => {
    return students.reduce((acc, student) => {
      acc[student.departmentName] = (acc[student.departmentName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [students])

  const pointsData = useMemo(() => {
    return students
      .map(student => ({
        name: student.fullName,
        points: student.points
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
  }, [students])

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <AdminNavbar/>
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="points">Add Points</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{students.length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{tasks.length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{tasks.filter(task => task.status === 'pending').length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{tasks.filter(task => task.status === 'completed').length}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Leaderboard Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointsData.slice(0, 5).map((student, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Tasks</h2>
                  <Button onClick={() => setActiveForm(FormType.Task)}>Add New Task</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                
                  </TableHeader>
                  <TableBody>
                    {filteredData.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>{task.deadline}</TableCell>
                        <TableCell>{task.reward}</TableCell>
                        <TableCell>{task.status}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => { setEditTask(task); setActiveForm(FormType.Task); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Students</h2>
                  <Button onClick={() => setActiveForm(FormType.Student)}>Add New Student</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>SSHR</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.departmentName}</TableCell>
                        <TableCell>{student.sshr}</TableCell>
                        <TableCell>{student.points}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => { setEditStudent(student); setActiveForm(FormType.Student); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="points" className="space-y-4">
                <h2 className="text-2xl font-bold">Add Points</h2>
                <form onSubmit={handleAddPoints} className="space-y-4">
                  <div>
                    <Label htmlFor="student-select">Select Student</Label>
                    <Select onValueChange={(value) => setSelectedStudentId(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>{student.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="points-to-add">Points to Add</Label>
                    <Input type="number" id="points-to-add" name="points-to-add" required />
                  </div>
                  <Button type="submit">Add Points</Button>
                </form>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <h2 className="text-2xl font-bold">Analytics</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Students by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Bar
                        data={{
                          labels: Object.keys(departmentData),
                          datasets: [
                            {
                              label: 'Number of Students',
                              data: Object.values(departmentData),
                              backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            },
                          ],
                        }}
                        options={{
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0,
                              },
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Students by Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Line
                        data={{
                          labels: pointsData.map(d => d.name),
                          datasets: [
                            {
                              label: 'Points',
                              data: pointsData.map(d => d.points),
                              borderColor: 'rgba(75, 192, 192, 1)',
                              tension: 0.1,
                            },
                          ],
                        }}
                        options={{
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
                <Button onClick={exportToExcel}>
                  <Download className="mr-2 h-4 w-4" /> Export to Excel
                </Button>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {activeForm === FormType.Task && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-md w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{editTask ? 'Edit Task' : 'Add New Task'}</h2>
                <Button variant="outline" onClick={closeForm}><X size={16} /></Button>
              </div>
              <form onSubmit={editTask ? handleUpdateTask : handleAddTask}>
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  type="text"
                  id="task-title"
                  name="task-title"
                  defaultValue={editTask?.title || ''}
                  required
                  className="mt-2"
                />
                <Label htmlFor="task-description" className="mt-4">Task Description</Label>
                <Textarea
                  id="task-description"
                  name="task-description"
                  defaultValue={editTask?.description || ''}
                  required
                  className="mt-2"
                />
                <Label htmlFor="task-deadline" className="mt-4">Deadline</Label>
                <Input
                  type="date"
                  id="task-deadline"
                  name="task-deadline"
                  defaultValue={editTask?.deadline || ''}
                  required
                  className="mt-2"
                />
                <Label htmlFor="task-reward" className="mt-4">Reward Points</Label>
                <Input
                  type="number"
                  id="task-reward"
                  name="task-reward"
                  defaultValue={editTask?.reward || ''}
                  required
                  className="mt-2"
                />
                <Button type="submit" className="mt-4">{editTask ? 'Update Task' : 'Add Task'}</Button>
              </form>
            </div>
          </div>
        )}

        {activeForm === FormType.Student && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-md w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{editStudent ? 'Edit Student' : 'Add New Student'}</h2>
                <Button variant="outline" onClick={closeForm}><X size={16} /></Button>
              </div>
              <form onSubmit={editStudent ? handleUpdateStudent : handleAddStudent}>
                <Label htmlFor="student-fullname">Full Name</Label>
                <Input
                  type="text"
                  id="student-fullname"
                  name="student-fullname"
                  defaultValue={editStudent?.fullName || ''}
                  required
                  className="mt-2"
                />
                <Label htmlFor="student-department" className="mt-4">Department</Label>
                <Input
                  type="text"
                  id="student-department"
                  name="student-department"
                  defaultValue={editStudent?.departmentName || ''}
                  required
                  className="mt-2"
                />
                <Label htmlFor="student-sshr" className="mt-4">SSHR Number</Label>
                <Input
                  type="number"
                  id="student-sshr"
                  name="student-sshr"
                  defaultValue={editStudent?.sshr || ''}
                  required
                  className="mt-2"
                />
                <Label htmlFor="student-avatar" className="mt-4">Avatar URL</Label>
                <Input
                  type="url"
                  id="student-avatar"
                  name="student-avatar"
                  defaultValue={editStudent?.avatarUrl || ''}
                  className="mt-2"
                />
                <Button type="submit" className="mt-4">{editStudent ? 'Update Student' : 'Add Student'}</Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}