import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Settings, Calendar, Edit, Trash, Repeat, ChevronLeft, ChevronRight, PlusCircle, Target, Tag } from 'lucide-react';

// Modal Component
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-4 w-80">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
      <button onClick={onClose} className="mt-4 p-2 bg-gray-300 rounded">Close</button>
    </div>
  </div>
);

// Utility functions
const getEncouragingPhrase = () => {
  const phrases = ["You're proving your strength!", "Keep up the great work!", "You're on fire!"];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

const getEmoji = () => {
  const emojis = ['🌱', '🌿', '🌳', '🌻'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

// HomePage Component
const HomePage = ({ tasks, setTasks, streak, setStreak, goals, setGoals }) => {
  const [emoji, setEmoji] = useState(getEmoji());
  const [encouragingPhrase, setEncouragingPhrase] = useState(getEncouragingPhrase());
  const [currentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [tasksCompletedToday, setTasksCompletedToday] = useState(false);

  useEffect(() => {
    const allCompleted = tasks.every(task => task.completed);
    if (allCompleted) {
      setEmoji(getEmoji());
      setEncouragingPhrase(getEncouragingPhrase());
    }
  }, [tasks]);

  useEffect(() => {
    const today = new Date().toDateString();
    const completedToday = tasks.some(task => task.completed && task.date === today);
    setTasksCompletedToday(completedToday);
  }, [tasks]);

  // Reset streak on Monday if goals are not met
  useEffect(() => {
    const today = new Date();
    if (today.getDay() === 1) {
      const goalsIncomplete = goals.some(goal => goal.progress < goal.target);
      if (goalsIncomplete) {
        setStreak(0);
      }
    }
  }, [goals]);

  const toggleTaskCompletion = (taskId) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );

      const task = updatedTasks.find(task => task.id === taskId);
      if (task && task.label) {
        const relatedGoal = goals.find(goal => goal.title === task.label);
        if (relatedGoal) {
          const newProgress = updatedTasks.filter(t => t.label === task.label && t.completed).length;
          setGoals(goals.map(g => g.id === relatedGoal.id ? { ...g, progress: newProgress } : g));
        }
      }

      // Handle streak update - max +1 per day if a task is completed
      const today = new Date().toDateString();
      const completedToday = updatedTasks.some(task => task.completed && task.date === today);
      if (!tasksCompletedToday && completedToday) {
        setStreak(prevStreak => prevStreak + 1);
      }

      return updatedTasks;
    });
  };

  const getWeekDates = () => {
    const today = new Date(currentDate);
    const week = [];
    today.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday as the start of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      week.push(date);
    }
    return week;
  };

  // Handle Adding a new task
  const addTask = (date) => {
    const newTask = {
      id: Date.now(),
      title: `New Task at ${date.toDateString()}`,
      completed: false,
      date: date.toDateString(),
      recurrence: null,
      label: ''
    };
    setTasks([...tasks, newTask]);
  };

  // Handle Rescheduling
  const handleRescheduleTask = (task, newDate) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, date: newDate.toDateString() } : t)));
  };

  // Handle Recurrence for Daily, Weekly, or Monthly
  const handleSetRecurringTask = (task, recurrenceType) => {
    const updatedTasks = [...tasks]; 
    const originalDate = new Date(task.date);

    for (let i = 1; i <= 30; i++) { // Adjust this number as needed
      const newDate = new Date(originalDate);
      
      if (recurrenceType === 'daily') {
        newDate.setDate(originalDate.getDate() + i); // Daily recurrence
      } else if (recurrenceType === 'weekly') {
        newDate.setDate(originalDate.getDate() + i * 7); // Weekly recurrence
      } else if (recurrenceType === 'monthly') {
        newDate.setMonth(originalDate.getMonth() + i); // Monthly recurrence
      }

      const newTask = {
        ...task,
        id: Date.now() + i, // Generate a unique ID for each task
        date: newDate.toDateString(), // Set the new date
        originalTaskId: task.id, // Add original task ID for recurrence tracking
        label: task.label // Keep label for recurring tasks
      };

      updatedTasks.push(newTask); // Add the task to the list
    }

    setTasks(updatedTasks); // Update state
    setShowModal(false); // Close modal
  };

  // Edit task
  const handleEditTask = (task, newTitle) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, title: newTitle } : t)));
  };

  // Delete Task and Recurring Instances
  const handleDeleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => 
      task.id !== taskId && task.originalTaskId !== taskId // Deletes both the task and its recurring instances
    ));
  };

  const openModal = (task, type) => {
    setSelectedTask(task);
    setModalType(type);
    setShowModal(true);
  };

  // Determine if a recurring task is due
  const isRecurringTaskDue = (task, currentDate) => {
    const taskDate = new Date(task.date);
    const today = new Date(currentDate);

    if (task.recurrence === 'daily') {
      return today >= taskDate;
    }

    if (task.recurrence === 'weekly') {
      const daysDifference = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));
      return today >= taskDate && daysDifference % 7 === 0;
    }

    if (task.recurrence === 'monthly') {
      return today >= taskDate && today.getDate() === taskDate.getDate();
    }

    // Default case for non-recurring tasks
    return today.toDateString() === taskDate.toDateString();
  };

  const visibleTasks = tasks.filter(task => isRecurringTaskDue(task, currentDate.toDateString()));

  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Home page</h1>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="text-4xl font-bold">{streak} days {emoji}</div>
        <div className="text-sm text-gray-600">{encouragingPhrase}</div>
        <div className="flex justify-between mt-4">
          {getWeekDates().map((date, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2"
            >
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  date.toDateString() === currentDate.toDateString() 
                    ? 'bg-yellow-400' 
                    : tasks.every(task => task.completed) && date.toDateString() === currentDate.toDateString()
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`}
              >
                {date.getDate()}
              </div>
              {/* Only show "Plus" icon for the current day */}
              {date.toDateString() === currentDate.toDateString() && (
                <button onClick={() => addTask(date)}>
                  <PlusCircle size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="font-bold mb-2">
          {currentDate.toLocaleString('default', { month: 'short' })} {currentDate.getDate()} {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()]}
        </div>
        {visibleTasks.map(task => (
          <div key={task.id} className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <input type="checkbox" checked={task.completed} onChange={() => toggleTaskCompletion(task.id)} className="mr-2" />
              <span>{task.title} <span className="text-xs text-gray-500">({task.label || 'No Label'})</span></span>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openModal(task, 'edit')}><Edit size={18} /></button>
              <button onClick={() => openModal(task, 'reschedule')}><Calendar size={18} /></button>
              <button onClick={() => openModal(task, 'delete')}><Trash size={18} className="text-red-500" /></button>
              <button onClick={() => openModal(task, 'recurring')}><Repeat size={18} /></button>
              <button onClick={() => openModal(task, 'label')}><Tag size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedTask && modalType === 'edit' && (
        <Modal title="Edit Task" onClose={() => setShowModal(false)}>
          <input type="text" defaultValue={selectedTask.title} onChange={(e) => handleEditTask(selectedTask, e.target.value)} className="p-2 border border-gray-300 rounded" />
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'reschedule' && (
        <Modal title="Reschedule Task" onClose={() => setShowModal(false)}>
          <input type="date" onChange={(e) => handleRescheduleTask(selectedTask, new Date(e.target.value))} className="p-2 border border-gray-300 rounded" />
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'delete' && (
        <Modal title="Delete Task" onClose={() => setShowModal(false)}>
          <p>Do you want to delete just this task or all recurring instances?</p>
          <button onClick={() => { handleDeleteTask(selectedTask.id); setShowModal(false); }} className="p-2 bg-red-500 text-white rounded">Delete This Task Only</button>
          <button onClick={() => { handleDeleteTask(selectedTask.originalTaskId || selectedTask.id); setShowModal(false); }} className="p-2 bg-red-500 text-white rounded">Delete All Recurring Tasks</button>
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'recurring' && (
        <Modal title="Set Recurrence" onClose={() => setShowModal(false)}>
          <button onClick={() => handleSetRecurringTask(selectedTask, 'daily')} className="p-2 border border-gray-300 rounded">Daily</button>
          <button onClick={() => handleSetRecurringTask(selectedTask, 'weekly')} className="p-2 border border-gray-300 rounded">Weekly</button>
          <button onClick={() => handleSetRecurringTask(selectedTask, 'monthly')} className="p-2 border border-gray-300 rounded">Monthly</button>
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'label' && (
        <Modal title="Set Task Label" onClose={() => setShowModal(false)}>
          <select value={selectedTask.label || ''} onChange={(e) => setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, label: e.target.value } : t))} className="p-2 border border-gray-300 rounded">
            <option value="">No Label</option>
            {goals.map(goal => (
              <option key={goal.id} value={goal.title}>{goal.title}</option>
            ))}
          </select>
        </Modal>
      )}
    </div>
  );
};

// LogView Component
const LogView = ({ tasks, setTasks, goals }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatDateRange = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })}`;
  };

  const handleRescheduleTask = (task, newDate) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, date: newDate.toDateString() } : t)));
  };

  const handleSetRecurringTask = (task, recurrenceType) => {
    const recurrence = {
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly'
    }[recurrenceType];
    if (recurrence) {
      task.recurrence = recurrence;
      setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, recurrence } : t)));
    }
  };

  const handleEditTask = (task, newTitle) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, title: newTitle } : t)));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId && task.originalTaskId !== taskId));
  };

  const openModal = (task, type) => {
    setSelectedTask(task);
    setModalType(type);
    setShowModal(true);
  };

  const changeWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: `New Note`,
      completed: false,
      date: null,
      recurrence: null,
    };
    setTasks([...tasks, newNote]);
  };

  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Week {formatDateRange(getWeekDates()[0])}</h1>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center">
          <button onClick={() => changeWeek(-1)} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronLeft />
          </button>
          <span className="font-bold text-lg">Week {formatDateRange(getWeekDates()[0])}</span>
          <button onClick={() => changeWeek(1)} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronRight />
          </button>
        </div>
      </div>

      {getWeekDates().map((date, index) => (
        <div key={index} className="mb-4">
          <div className="font-bold text-lg mb-2">{date.toDateString()}</div>
          <ul>
            {tasks
              .filter(task => task.date && new Date(task.date).toDateString() === date.toDateString())
              .map(task => (
                <li key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                  <div className="flex items-center">
                    <input type="checkbox" checked={task.completed} onChange={() => {
                      const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t);
                      setTasks(updatedTasks);
                    }} className="mr-2" />
                    <span>{task.title} <span className="text-xs text-gray-500">({task.label || 'No Label'})</span></span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => openModal(task, 'edit')}><Edit size={18} /></button>
                    <button onClick={() => openModal(task, 'reschedule')}><Calendar size={18} /></button>
                    <button onClick={() => openModal(task, 'delete')}><Trash size={18} className="text-red-500" /></button>
                    <button onClick={() => openModal(task, 'recurring')}><Repeat size={18} /></button>
                    <button onClick={() => openModal(task, 'label')}><Tag size={18} /></button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {/* Note Section */}
      <div className="mb-4">
        <div className="font-bold text-lg mb-2">Note</div>
        <ul>
          {tasks
            .filter(task => !task.date)
            .map(task => (
              <li key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <div className="flex items-center">
                  <span>{task.title}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openModal(task, 'edit')}><Edit size={18} /></button>
                  <button onClick={() => openModal(task, 'reschedule')}><Calendar size={18} /></button>
                  <button onClick={() => openModal(task, 'delete')}><Trash size={18} className="text-red-500" /></button>
                  <button onClick={() => openModal(task, 'recurring')}><Repeat size={18} /></button>
                </div>
              </li>
            ))}
        </ul>
        <button onClick={addNote} className="p-2 bg-blue-500 text-white rounded">Add Note</button>
      </div>

      {showModal && selectedTask && modalType === 'edit' && (
        <Modal title="Edit Task" onClose={() => setShowModal(false)}>
          <input type="text" defaultValue={selectedTask.title} onChange={(e) => handleEditTask(selectedTask, e.target.value)} className="p-2 border border-gray-300 rounded" />
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'reschedule' && (
        <Modal title="Reschedule Task" onClose={() => setShowModal(false)}>
          <input type="date" onChange={(e) => handleRescheduleTask(selectedTask, new Date(e.target.value))} className="p-2 border border-gray-300 rounded" />
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'delete' && (
        <Modal title="Delete Task" onClose={() => setShowModal(false)}>
          <p>Do you want to delete just this task or all recurring instances?</p>
          <button onClick={() => { handleDeleteTask(selectedTask.id); setShowModal(false); }} className="p-2 bg-red-500 text-white rounded">Delete This Task Only</button>
          <button onClick={() => { handleDeleteTask(selectedTask.originalTaskId || selectedTask.id); setShowModal(false); }} className="p-2 bg-red-500 text-white rounded">Delete All Recurring Tasks</button>
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'recurring' && (
        <Modal title="Set Recurrence" onClose={() => setShowModal(false)}>
          <button onClick={() => handleSetRecurringTask(selectedTask, 'daily')} className="p-2 border border-gray-300 rounded">Daily</button>
          <button onClick={() => handleSetRecurringTask(selectedTask, 'weekly')} className="p-2 border border-gray-300 rounded">Weekly</button>
          <button onClick={() => handleSetRecurringTask(selectedTask, 'monthly')} className="p-2 border border-gray-300 rounded">Monthly</button>
        </Modal>
      )}

      {showModal && selectedTask && modalType === 'label' && (
        <Modal title="Set Task Label" onClose={() => setShowModal(false)}>
          <select value={selectedTask.label || ''} onChange={(e) => setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, label: e.target.value } : t))} className="p-2 border border-gray-300 rounded">
            <option value="">No Label</option>
            {goals.map(goal => (
              <option key={goal.id} value={goal.title}>{goal.title}</option>
            ))}
          </select>
        </Modal>
      )}
    </div>
  );
};

// SettingsView Component
const SettingsView = ({ settings, setSettings }) => {
  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4">
          <span>Week Starts On: </span>
          <select value={settings.weekStartsOn} onChange={(e) => setSettings({ ...settings, weekStartsOn: e.target.value })} className="p-2 border border-gray-300 rounded">
            <option value="Mon">Monday</option>
            <option value="Sun">Sunday</option>
          </select>
        </div>
        <div className="mb-4">
          <span>Notifications: </span>
          <button onClick={() => setSettings({ ...settings, notifications: !settings.notifications })} className="p-2 bg-gray-300 rounded">
            {settings.notifications ? 'On' : 'Off'}
          </button>
        </div>
        <div className="mb-4">
          <span>Sound: </span>
          <button onClick={() => setSettings({ ...settings, sound: !settings.sound })} className="p-2 bg-gray-300 rounded">
            {settings.sound ? 'On' : 'Off'}
          </button>
        </div>
        <div className="mb-4">
          <span>Vibration: </span>
          <button onClick={() => setSettings({ ...settings, vibration: !settings.vibration })} className="p-2 bg-gray-300 rounded">
            {settings.vibration ? 'On' : 'Off'}
          </button>
        </div>
        <div>
          <span>Streak savers remaining: {settings.streakSavers}</span>
        </div>
      </div>
    </div>
  );
};

// GoalView Component
const GoalsPage = ({ goals, setGoals, tasks }) => {
  const [newGoal, setNewGoal] = useState('');

  const addGoal = () => {
    if (newGoal) {
      setGoals([...goals, { id: Date.now(), title: newGoal, target: 3, progress: 0 }]);
      setNewGoal('');
    }
  };

  const updateGoalProgress = () => {
    setGoals(goals.map(goal => {
      const completedTasks = tasks.filter(task => task.label === goal.title && task.completed).length;
      return { ...goal, progress: completedTasks };
    }));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  useEffect(() => {
    updateGoalProgress();
  }, [tasks]);

  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Weekly Goals</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {goals.map(goal => (
          <div key={goal.id} className="mb-4">
            <div className="flex justify-between items-center">
              <span>{goal.title} ({goal.progress}/{goal.target})</span>
              <div className="flex space-x-2">
                <button className="p-1"><Edit size={18} /></button>
                <button onClick={() => deleteGoal(goal.id)} className="p-1 text-red-500"><Trash size={18} /></button>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(goal.progress / goal.target) * 100}%` }}></div>
            </div>
          </div>
        ))}
        <input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="New Goal"
          className="p-2 border border-gray-300 rounded mt-4 w-full"
        />
        <button onClick={addGoal} className="p-2 bg-blue-500 text-white rounded mt-2 w-full">Add Goal</button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [tasks, setTasks] = useState([
    { id: 1, title: '08:00 max 2', completed: false, date: new Date().toDateString(), recurrence: null, label: '' },
    { id: 2, title: '10:30 Casa', completed: false, date: new Date().toDateString(), recurrence: null, label: '' },
    { id: 3, title: '12:00 Exercise', completed: false, date: new Date().toDateString(), recurrence: null, label: 'Gym' },
    { id: 4, title: '13:30 Learn Brilliant', completed: false, date: new Date().toDateString(), recurrence: null, label: 'Learn' },
  ]);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState([
    { id: 1, title: 'Gym', target: 3, progress: 0 },
    { id: 2, title: 'Chores', target: 5, progress: 0 },
    { id: 3, title: 'Learn', target: 3, progress: 0 }
  ]);
  const [settings, setSettings] = useState({
    weekStartsOn: 'Mon',
    notifications: true,
    sound: true,
    vibration: true,
    streakSavers: 2,
  });

  return (
    <div className="max-w-md mx-auto bg-gray-100 h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {currentView === 'home' && <HomePage tasks={tasks} setTasks={setTasks} streak={streak} setStreak={setStreak} goals={goals} setGoals={setGoals} />}
        {currentView === 'log' && <LogView tasks={tasks} setTasks={setTasks} goals={goals} />}
        {currentView === 'goals' && <GoalsPage goals={goals} setGoals={setGoals} tasks={tasks} />}
        {currentView === 'settings' && <SettingsView settings={settings} setSettings={setSettings} />}
      </div>
      <div className="flex justify-around items-center p-4 bg-white">
        <button onClick={() => setCurrentView('home')} className="p-2 bg-green-200 rounded"><Home /></button>
        <button onClick={() => setCurrentView('log')} className="p-2 bg-purple-200 rounded"><BookOpen /></button>
        <button onClick={() => setCurrentView('goals')} className="p-2 bg-blue-200 rounded"><Target /></button>
        <button onClick={() => setCurrentView('settings')} className="p-2 bg-purple-200 rounded"><Settings /></button>
      </div>
    </div>
  );
};

export default App;

