import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

// Define collections
const TASKS_COLLECTION = 'tasks';
const STUDENTS_COLLECTION = 'students';

// Add Task
export const addTask = async (task: { title: string; description: string; deadline: string; reward: number }) => {
  await addDoc(collection(db, TASKS_COLLECTION), task);
};

// Update Task
export const updateTask = async (
  id: string,
  updatedTask: { title?: string; description?: string; deadline?: string; reward?: number }
) => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await updateDoc(taskRef, updatedTask);
};

// Add Student
export const addStudent = async (student: { fullName: string; departmentName: string; avatarUrl: string }) => {
  await addDoc(collection(db, STUDENTS_COLLECTION), student);
};

// Update Student
export const updateStudent = async (
  id: string,
  updatedStudent: { fullName?: string; departmentName?: string; avatarUrl?: string }
) => {
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  await updateDoc(studentRef, updatedStudent);
};

// Update Points for Student
export const updatePoints = async (id: string, points: number ) => {
  if (typeof id === 'string' && id.trim() !== '') {
    const studentRef = doc(db, STUDENTS_COLLECTION, id);
    const updatedAt: Timestamp = Timestamp.now();
    await updateDoc(studentRef, { points, updatedAt });
  } else {
    throw new Error('Invalid document ID');
  }
};

// Get Students
export const getStudents = async () => {
  const studentsCol = collection(db, STUDENTS_COLLECTION);
  const studentSnapshot = await getDocs(studentsCol);
  return studentSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    points: doc.data().points,
  }));
};

// Define Student interface
interface Student {
  id: string;
  fullName: string;
  departmentName: string;
  avatarUrl: string;
  points: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Real-time Listener for Students
export const listenToStudents = (callback: (data: Student[]) => void) => {
  const studentsCol = collection(db, STUDENTS_COLLECTION);
  return onSnapshot(studentsCol, (snapshot: QuerySnapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
    callback(data);
  });
};

// Define Task interface
interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  reward: number;
}

// Real-time Listener for Tasks
export const listenToTasks = (callback: (data: Task[]) => void) => {
  const tasksCol = collection(db, TASKS_COLLECTION);
  return onSnapshot(tasksCol, (snapshot: QuerySnapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task));
    callback(data);
  });
};

// Delete Task
export const deleteTask = async (id: string) => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskRef);
};

// Delete Student
export const deleteStudent = async (id: string) => {
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  await deleteDoc(studentRef);
};

// Get Students with ordering
export const getStudents2 = async (): Promise<Student[]> => {
  try {
    const studentsCol = collection(db, STUDENTS_COLLECTION);
    const q = query(studentsCol, orderBy('points', 'desc'), orderBy('timestamp', 'asc'));
    
    const studentSnapshot = await getDocs(q);

    // Log to verify
    console.log('Student documents:', studentSnapshot.docs);

    return studentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Student));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};
