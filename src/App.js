// App.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  BookOpen,
  Settings as SettingsIcon,
  Target,
  PlusCircle,
  Calendar
} from 'lucide-react';
import './index.css';

import HomePage from './components/HomePage';
import LogView from './components/LogView';
import GoalsPage from './components/GoalsPage';
import MonthView from './components/MonthView';
import Modal from './components/Modal';

// Import Capacitor's Local Notifications
import { LocalNotifications } from '@capacitor/local-notifications';

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('home');

  // Ensure all IDs are strings
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: '08:00 max 2',
      completed: false,
      dates: [new Date().toISOString().substr(0, 10)],
      time: '08:00',
      recurrence: null,
      label: '',
      goalId: '2', // Assuming '2' corresponds to 'Chores'
      order: 0,
    },
    {
      id: '2',
      title: '10:30 Casa',
      completed: false,
      dates: [new Date().toISOString().substr(0, 10)],
      time: '10:30',
      recurrence: null,
      label: '',
      goalId: '',
      order: 1,
    },
    {
      id: '3',
      title: '12:00 Exercise',
      completed: false,
      dates: [new Date().toISOString().substr(0, 10)],
      time: '12:00',
      recurrence: null,
      label: 'Gym',
      goalId: '1', // Assuming '1' corresponds to 'Gym'
      order: 2,
    },
    {
      id: '4',
      title: '13:30 Learn Brilliant',
      completed: false,
      dates: [new Date().toISOString().substr(0, 10)],
      time: '13:30',
      recurrence: null,
      label: 'Learn',
      goalId: '3', // Assuming '3' corresponds to 'Learn'
      order: 3,
    },
  ]);

  const [streak, setStreak] = useState(0);

  const [goals, setGoals] = useState([
    { id: '1', title: 'Gym', target: 3, progress: 0, color: '#FF6384' },
    { id: '2', title: 'Chores', target: 5, progress: 0, color: '#36A2EB' },
    { id: '3', title: 'Learn', target: 3, progress: 0, color: '#FFCE56' },
  ]);

  const defaultSettings = {
    weekStartsOn: 'Mon',
    notifications: true,
    sound: true,
    vibration: true,
    streakSavers: 2, // Initialize with 2 streak savers
    darkMode: false,
    enableMorningReminder: false,
    morningReminderTime: '08:00',
    enableAfternoonReminder: false,
    afternoonReminderTime: '12:00',
    enableEveningReminder: false,
    eveningReminderTime: '18:00',
  };

  const [settings, setSettings] = useState(defaultSettings);

  // **Move weeksCompleted state inside the App component**
  const [weeksCompleted, setWeeksCompleted] = useState(1);

  // Load data from localStorage when the app initializes
  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    const storedGoals = localStorage.getItem('goals');
    const storedSettings = localStorage.getItem('settings');
    const storedStreak = localStorage.getItem('streak');
    const storedWeeksCompleted = localStorage.getItem('weeksCompleted');

    if (storedTasks) setTasks(JSON.parse(storedTasks));
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    if (storedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
    } else {
      setSettings(defaultSettings);
    }
    if (storedStreak) setStreak(JSON.parse(storedStreak));
    if (storedWeeksCompleted) setWeeksCompleted(JSON.parse(storedWeeksCompleted));
  }, []);

  // Modal state and functions
  const [modalTask, setModalTask] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const openEditModal = (task) => {
    setModalTask(task);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setModalTask(null);
  };

  // Function to add a new task
  const addNewTask = () => {
    const today = new Date().toISOString().substr(0, 10);
    const newTask = {
      id: Date.now().toString(),
      title: 'New Task',
      completed: false,
      dates: [today],
      time: '',
      recurrence: null,
      label: '',
      goalId: '',
      order: tasks.length, // Set order to the end of the list
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    openEditModal(newTask);
  };

  // Function to handle recurring tasks
  const handleSetRecurringTask = useCallback(
    (task) => {
      if (task.recurrence) {
        const recurrenceType = task.recurrence.type;
        const interval = task.recurrence.interval || 1;
        const startDate = new Date(task.dates[0]);
        const dates = [task.dates[0]];

        for (let i = 1; i <= 30; i++) {
          const nextDate = new Date(startDate);
          if (recurrenceType === 'daily') {
            nextDate.setDate(startDate.getDate() + i * interval);
          } else if (recurrenceType === 'weekly') {
            nextDate.setDate(startDate.getDate() + i * interval * 7);
          } else if (recurrenceType === 'monthly') {
            nextDate.setMonth(startDate.getMonth() + i * interval);
          }
          dates.push(nextDate.toISOString().substr(0, 10));
        }

        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === task.id ? { ...t, dates } : t
          )
        );
      }
    },
    [setTasks]
  );

  // Save data to localStorage whenever tasks, goals, settings, or weeksCompleted change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('streak', JSON.stringify(streak));
    localStorage.setItem('weeksCompleted', JSON.stringify(weeksCompleted));
  }, [tasks, goals, settings, streak, weeksCompleted]);

  // Apply dark mode based on settings
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [settings.darkMode]);

  // Request notification permissions using Capacitor
  useEffect(() => {
    if (settings.notifications) {
      LocalNotifications.requestPermissions().then((result) => {
        if (result.receive === 'granted') {
          console.log('Notifications permission granted.');
        } else {
          console.log('Notifications permission denied.');
        }
      });
    }
  }, [settings.notifications]);

  // Function to update both tasks and goals when a task is toggled
  const toggleTaskCompletion = useCallback((taskId) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );

      // Update goals progress based on the updated tasks
      const updatedGoals = goals.map((goal) => {
        const relatedTasks = updatedTasks.filter((task) => task.goalId === goal.id);
        const completedTasks = relatedTasks.filter((task) => task.completed);
        return { ...goal, progress: completedTasks.length };
      });

      setGoals(updatedGoals);
      return updatedTasks;
    });
  }, [goals, setGoals]);

  return (
    <div
      className={`max-w-md mx-auto ${
        settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-500'
      } h-screen flex flex-col`}
    >
      <div className="flex-1 overflow-y-auto">
        {currentView === 'home' && (
          <HomePage
            tasks={tasks}
            setTasks={setTasks}
            streak={streak}
            setStreak={setStreak}
            goals={goals}
            setGoals={setGoals}
            handleSetRecurringTask={handleSetRecurringTask}
            openEditModal={openEditModal}
            settings={settings}
            setSettings={setSettings}
            weeksCompleted={weeksCompleted}
            setWeeksCompleted={setWeeksCompleted}
            toggleTaskCompletion={toggleTaskCompletion}
          />
        )}

        {currentView === 'goals' && (
          <GoalsPage
            goals={goals}
            setGoals={setGoals}
            tasks={tasks}
            weeksCompleted={weeksCompleted}
            settings={settings}
          />
        )}

        {currentView === 'log' && (
          <LogView
            tasks={tasks}
            setTasks={setTasks}
            goals={goals}
            setGoals={setGoals}
            openEditModal={openEditModal}
            handleSetRecurringTask={handleSetRecurringTask}
            settings={settings}
            toggleTaskCompletion={toggleTaskCompletion}
          />
        )}

        {currentView === 'month' && (
          <MonthView
            tasks={tasks}
            setTasks={setTasks}
            goals={goals}
            setGoals={setGoals}
            openEditModal={openEditModal}
            settings={settings}
          />
        )}
      </div>
      <div
        className={`flex justify-around items-center p-4 ${
          settings.darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 bg-green-200 rounded"
        >
          <Home />
        </button>
        <button
          onClick={() => setCurrentView('goals')}
          className="p-2 bg-blue-200 rounded"
        >
          <Target />
        </button>
        {/* Add Task Button in the middle */}
        <button
          onClick={addNewTask}
          className="p-0 bg-blue-500 text-white rounded-full transform -translate-y-2 flex items-center justify-center"
          style={{ width: '60px', height: '60px' }}
        >
          <PlusCircle size={32} />
        </button>
        <button
          onClick={() => setCurrentView('log')}
          className="p-2 bg-purple-200 rounded"
        >
          <BookOpen />
        </button>
        <button
          onClick={() => setCurrentView('month')}
          className="p-2 bg-purple-200 rounded"
        >
          <Calendar />
        </button>
      </div>

      {/* Modal for adding/editing tasks */}
      {isEditModalOpen && modalTask && (
        <Modal
          title="Edit Task"
          onClose={closeEditModal}
          task={modalTask}
          setTasks={setTasks}
          goals={goals}
          handleSetRecurringTask={handleSetRecurringTask}
        />
      )}
    </div>
  );
};

export default App;