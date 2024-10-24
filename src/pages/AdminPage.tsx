'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { X, Plus, Edit, Trash2, Download } from 'lucide-react'
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
  id: string
  title: string
  description: string
  deadline: string
  reward: number
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
  const [filterType, setFilterType] = useState('all')

  const { theme } = useTheme()

  useEffect(() => {
    const unsubscribeStudents = listenToStudents(setStudents)
    const unsubscribeTasks = listenToTasks(setTasks)
    return () => {
      unsubscribeStudents()
      unsubscribeTasks()
    }
  }, [])

  const closeForm = () => {
    setActiveForm(FormType.None)
    setEditTask(null)
    setEditStudent(null)
  }

  const handleTabChange = (value: string) => {
    if (activeForm === FormType.None) {
      setActiveTab(value)
    }
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
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const pointsToAdd = parseInt(formData.get('points-to-add') as string, 10);
  
    if (selectedStudentId && !isNaN(pointsToAdd) && pointsToAdd > 0) {
      try {
        const students = await getStudents();
        const student = students.find((stu) => stu.id === selectedStudentId);
  
        if (student) {
          const newPoints = student.points + pointsToAdd;
          await updatePoints(selectedStudentId, newPoints);
          closeForm();
        } else {
          console.error('Student not found');
        }
      } catch (error) {
        console.error('Error updating points:', error);
      }
    } else {
      console.error('Invalid student ID or points value');
    }
  };

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
    const workbook = XLSX.utils.book_new();
    
    // Export students
    const studentsWS = XLSX.utils.json_to_sheet(students.map(s => ({
      ...s,
      createdAt: s.createdAt.toDate().toLocaleString(),
      updatedAt: s.updatedAt.toDate().toLocaleString()
    })));
    XLSX.utils.book_append_sheet(workbook, studentsWS, "Students");

    // Export tasks
    const tasksWS = XLSX.utils.json_to_sheet(tasks);
    XLSX.utils.book_append_sheet(workbook, tasksWS, "Tasks");

    // Save the file
    XLSX.writeFile(workbook, "admin_dashboard_data.xlsx");
  }

  // Prepare data for charts
  const departmentData = students.reduce((acc, student) => {
    acc[student.departmentName] = (acc[student.departmentName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pointsData = students.map(student => ({
    name: student.fullName,
    points: student.points
  })).sort((a, b) => b.points - a.points).slice(0, 10);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <AdminNavbar/>
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="overview" disabled={activeForm !== FormType.None}>Overview</TabsTrigger>
            <TabsTrigger value="tasks" disabled={activeForm !== FormType.None}>Tasks</TabsTrigger>
            <TabsTrigger value="students" disabled={activeForm !== FormType.None}>Students</TabsTrigger>
            <TabsTrigger value="points" disabled={activeForm !== FormType.None}>Add Points</TabsTrigger>
            <TabsTrigger value="analytics" disabled={activeForm !== FormType.None}>Analytics</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                        <p>Total Students: {students.length}</p>
                        <p>Total Tasks: {tasks.length}</p>
                        <p>Completed Tasks: {tasks.filter(task => task.status === 'completed').length}</p>
                        <p>Pending Tasks: {tasks.filter(task => task.status === 'pending').length}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Search and Filter</h3>
                        <Input
                          type="text"
                          placeholder="Search students or tasks..."
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                        <Select onValueChange={(value) => setFilterType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="students">Students</SelectItem>
                            <SelectItem value="tasks">Tasks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Leaderboard Preview</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Department</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students
                            .sort((a, b) => b.points - a.points)
                            .slice(0, 5)
                            .map((student, index) => (
                              <TableRow key={student.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{student.fullName}</TableCell>
                                <TableCell>{student.points}</TableCell>
                                <TableCell>{student.departmentName}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Recent Tasks</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Deadline</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks
                            .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
                            .slice(0, 5)
                            .map((task) => (
                              <TableRow key={task.id}>
                                <TableCell>{task.title}</TableCell>
                                <TableCell>{task.status}</TableCell>
                                <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setActiveForm(FormType.Task)}>
                      <Plus size={16} className="mr-2" />
                      Add Task
                    </Button>
                    <div className="overflow-x-auto mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead>Reward</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>{task.title}</TableCell>
                              <TableCell className="hidden md:table-cell">{task.description}</TableCell>
                              <TableCell>{task.deadline}</TableCell>
                              <TableCell>{task.reward} points</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditTask(task)}>
                                    <Edit size={16} />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDeleteTask(task.id)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-4">
                      <Button onClick={() => setActiveForm(FormType.Student)}>
                        <Plus size={16} className="mr-2" />
                        Add Student
                      </Button>
                      <Button onClick={exportToExcel}>
                        <Download size={16} className="mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>SSHR</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>{student.fullName}</TableCell>
                              <TableCell>{student.departmentName}</TableCell>
                              <TableCell>{student.sshr}</TableCell>
                              <TableCell>{student.points}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditStudent(student)}>
                                    <Edit size={16} />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student.id)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="points">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Points to Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddPoints}>
                      <Label htmlFor="student-id">Select Student</Label>
                      <select
                        id="student-id"
                        className="block w-full mt-2 p-2 border rounded-md"
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        required
                      >
                        <option value="">Select a student</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} (SSHR: {student.sshr})
                          </option>
                        ))}
                      </select>
                      <Label htmlFor="points-to-add" className="mt-4">Points to Add</Label>
                      <Input
                        type="number"
                        id="points-to-add"
                        name="points-to-add"
                        className="mt-2"
                        required
                      />
                      <Button type="submit" className="mt-4">Add Points</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Students by Department</h3>
                        <Bar
                          data={{
                            labels: Object.keys(departmentData),
                            datasets: [{
                              label: 'Number of Students',
                              data: Object.values(departmentData),
                              backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            }]
                          }}
                          options={{
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Top 10 Students by Points</h3>
                        <Line
                          data={{
                            labels: pointsData.map(d => d.name),
                            datasets: [{
                              label: 'Points',
                              data: pointsData.map(d => d.points),
                              borderColor: 'rgba(255, 99, 132, 1)',
                              backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            }]
                          }}
                          options={{
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Task Form Modal */}
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

        {/* Student Form Modal */}
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