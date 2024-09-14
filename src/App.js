import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, BookOpen, Settings, Calendar, Edit, Trash, Repeat, ChevronLeft, ChevronRight, PlusCircle, Target, Tag } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './index.css';
import successSound from './success_sound.wav';


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
// SettingsView Component

const SettingsView = ({ settings, setSettings }) => {
  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4">
          <label className="block mb-2">Week Starts On:</label>
          <select
            value={settings.weekStartsOn}
            onChange={(e) => setSettings({...settings, weekStartsOn: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="Mon">Monday</option>
            <option value="Sun">Sunday</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              className="mr-2"
            />
            Enable Notifications
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => setSettings({...settings, sound: e.target.checked})}
              className="mr-2"
            />
            Enable Sound
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.vibration}
              onChange={(e) => setSettings({...settings, vibration: e.target.checked})}
              className="mr-2"
            />
            Enable Vibration
          </label>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Streak Savers:</label>
          <input
            type="number"
            value={settings.streakSavers}
            onChange={(e) => setSettings({...settings, streakSavers: parseInt(e.target.value)})}
            className="w-full p-2 border rounded"
            min="0"
            max="7"
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
              className="mr-2"
            />
            Enable Dark Mode
          </label>
        </div>
      </div>
    </div>
  );
};

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

const HomePage = ({ tasks, setTasks, streak, setStreak, goals, setGoals, handleSetRecurringTask }) => {
  const [emoji, setEmoji] = useState(getEmoji());
  const [encouragingPhrase, setEncouragingPhrase] = useState(getEncouragingPhrase());
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentDate] = useState(new Date());
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [buttonText, setButtonText] = useState("Mark day as done");
  const buttonRef = useRef(null);
  const [isDayMarkedDone, setIsDayMarkedDone] = useState(false);
  const [buttonFillPercentage, setButtonFillPercentage] = useState(0);
  const audioRef = useRef(new Audio(successSound));
  const [tasksCompletedToday, setTasksCompletedToday] = useState(false);

  useEffect(() => {
    const todayMarkedDone = localStorage.getItem('dayMarkedDone') === currentDate.toDateString();
    setIsDayMarkedDone(todayMarkedDone);
  }, [currentDate]);

  useEffect(() => {
    const todaysTasks = tasks.filter(task => new Date(task.date).toDateString() === currentDate.toDateString());
    const allCompleted = todaysTasks.length > 0 && todaysTasks.every(task => task.completed);
    setAllTasksCompleted(allCompleted);
  }, [tasks, currentDate]);

  const handleButtonPress = () => {
    if (isDayMarkedDone) return;

    setButtonPressed(true);
    setButtonText("Hold to mark as done...");
    const startTime = Date.now();
    const fillDuration = 3500; // 3.5 seconds

    const fillInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newFillPercentage = Math.min((elapsedTime / fillDuration) * 100, 100);
      setButtonFillPercentage(newFillPercentage);

      if (elapsedTime >= fillDuration) {
        clearInterval(fillInterval);
        setButtonText("Done for today");
        setStreak(prevStreak => prevStreak + 1);
        setIsDayMarkedDone(true);
        localStorage.setItem('dayMarkedDone', currentDate.toDateString());
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
    }, 50);

    const handleRelease = () => {
      clearInterval(fillInterval);
      setButtonPressed(false);
      setButtonText("Mark day as done");
      setButtonFillPercentage(0);
      document.removeEventListener('mouseup', handleRelease);
      document.removeEventListener('touchend', handleRelease);
    };

    document.addEventListener('mouseup', handleRelease);
    document.addEventListener('touchend', handleRelease);
  };

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

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

  useEffect(() => {
    const today = new Date();
    if (today.getDay() === 1) {
      const goalsIncomplete = goals.some(goal => goal.progress < goal.target);
      if (goalsIncomplete) {
        setStreak(0);
      }
    }
  }, [goals, setStreak]);
  

  const toggleTaskCompletion = (taskId) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
  
      const completedTask = updatedTasks.find(task => task.id === taskId);
  
      if (completedTask && completedTask.goalId) {
        const relatedGoal = goals.find(goal => goal.id === completedTask.goalId);
  
        if (relatedGoal) {
          const newProgress = updatedTasks.filter(t => t.goalId === completedTask.goalId && t.completed).length;
          setGoals(goals.map(g => g.id === relatedGoal.id ? { ...g, progress: newProgress } : g));
        }
      }
  
      return updatedTasks;
    });
  };
  
  

  const getWeekDates = () => {
    const today = new Date(currentDate);
    const week = [];
    today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      week.push(date);
    }
    return week;
  };

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

  const handleRescheduleTask = (task, newDate) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, date: newDate.toDateString() } : t)));
  };

  const handleEditTask = (task, newTitle) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, title: newTitle } : t)));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task =>
      task.id !== taskId && task.originalTaskId !== taskId
    ));
  };

  const openModal = (task, type) => {
    setSelectedTask(task);
    setModalType(type);
    setShowModal(true);
  };

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

    return today.toDateString() === taskDate.toDateString();
  };

  const visibleTasks = tasks.filter(task => isRecurringTaskDue(task, currentDate.toDateString()));
  
  {isEditModalOpen && selectedTask && (
    <Modal title="Edit Task" onClose={() => setEditModalOpen(false)}>
    <input
      type="text"
      value={selectedTask.title}
      onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
      className="p-2 border border-gray-300 rounded"
    />

    <textarea
      placeholder="Add some extra notes here..."
      className="p-2 border border-gray-300 rounded w-full mt-2"
      onChange={(e) => setSelectedTask({ ...selectedTask, subnote: e.target.value })}
    />

    <div className="mt-4">
      <label>Reschedule:</label>
      <input
        type="date"
        value={selectedTask.date}
        onChange={(e) => setSelectedTask({ ...selectedTask, date: e.target.value })}
        className="p-2 border border-gray-300 rounded"
      />
    </div>

    <div className="mt-4">
      <label>Set Recurrence:</label>
      <select
        onChange={(e) => setSelectedTask({ ...selectedTask, recurrence: e.target.value })}
        className="p-2 border border-gray-300 rounded"
        value={selectedTask.recurrence || ''}
      >
        <option value="">No Recurrence</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>

    <div className="mt-4">
      <label>Set Recurrence Until:</label>
      <input
        type="date"
        value={selectedTask.until || ''}
        onChange={(e) => setSelectedTask({ ...selectedTask, until: e.target.value })}
        className="p-2 border border-gray-300 rounded"
      />
    </div>

    <div className="mt-4">
      <label>Assign to Goal:</label>
      <select
        value={selectedTask.goalId || ''}
        onChange={(e) => setSelectedTask({ ...selectedTask, goalId: e.target.value })}
        className="p-2 border border-gray-300 rounded"
      >
        <option value="">No Goal</option>
        {goals.map(goal => (
          <option key={goal.id} value={goal.id}>{goal.title}</option>
        ))}
      </select>
    </div>

    <div className="mt-4 flex space-x-2">
      <button
        onClick={() => {
          if (selectedTask.recurrence) {
            handleSetRecurringTask(selectedTask);
          } else {
            setTasks(tasks.map(task => task.id === selectedTask.id ? selectedTask : task));
          }
          setEditModalOpen(false);
        }}
        className="p-2 bg-green-500 text-white rounded"
      >
        Save
      </button>
      <button
        onClick={() => {
          setTasks(tasks.filter(task => task.id !== selectedTask.id));
          setEditModalOpen(false);
        }}
        className="p-2 bg-red-500 text-white rounded"
      >
        Delete Task
      </button>
    </div>
  </Modal>
)}

  
  
 
  
  
  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Home page</h1>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="text-4xl font-bold">{streak} days {emoji}</div>
        <div className="text-sm text-gray-600">{encouragingPhrase}</div>
        <div className="flex justify-between mt-4">
          {getWeekDates().map((date, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                date.toDateString() === currentDate.toDateString()
                  ? 'bg-yellow-400'
                  : tasks.every(task => task.completed) && date.toDateString() === currentDate.toDateString()
                  ? 'bg-green-400'
                  : 'bg-gray-200'
              }`}>
                {date.getDate()}
              </div>
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
        <DragDropContext
  onDragEnd={(result) => {
    const { destination, source } = result;
    if (!destination) return;
    
    const updatedTasks = Array.from(tasks);
    const [movedTask] = updatedTasks.splice(source.index, 1);
    updatedTasks.splice(destination.index, 0, movedTask);

    setTasks(updatedTasks);
  }}
>
  <Droppable droppableId="taskList">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef}>
        {visibleTasks.map((task, index) => {
  const goal = goals.find(g => g.id === task.goalId); // Find the goal assigned to the task

  return (
    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="flex items-center justify-between mb-2"
        >
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTaskCompletion(task.id)}
              className="mr-2"
            />
            <span>{task.title}</span>
            
            {/* Show goal with color if the task is assigned to a goal */}
            {goal && (
              <span className="ml-2 flex items-center">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: goal.color }}></div>
                <span className="ml-1 text-xs text-gray-500">({goal.title})</span>
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
})}

        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>

        {allTasksCompleted && !isDayMarkedDone && (
          <button
            ref={buttonRef}
            onMouseDown={handleButtonPress}
            onTouchStart={handleButtonPress}
            className="mt-4 p-2 w-full rounded bg-blue-500 text-white relative overflow-hidden"
            style={{ height: '50px' }} // Set a fixed height for the button
          >
            <div
              className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-100 ease-linear"
              style={{ width: `${buttonFillPercentage}%` }}
            ></div>
            <span className="relative z-10">{buttonText}</span>
          </button>
        )}
        {isDayMarkedDone && (
          <div className="mt-4 p-2 w-full rounded bg-green-500 text-white text-center">
            Day marked as done!
          </div>
        )}
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

const LogView = ({ tasks, setTasks, goals, handleSetRecurringTask }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
   // Function to open the edit modal
   const openEditModal = (task) => {
    setSelectedTask(task);
    setEditModalOpen(true); // Use setEditModalOpen
  };

  // Function to close the edit modal
  const closeEditModal = () => {
    setEditModalOpen(false); // Use setEditModalOpen
    setSelectedTask(null);
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(
      selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7)
    );
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const changeWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  const addNewTask = (date) => {
    const newTask = {
      id: Date.now(),
      title: `New Task on ${date.toDateString()}`,
      completed: false,
      date: date.toDateString(),
      recurrence: null,
      label: ''
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    openEditModal(newTask);
  };

  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">
        Week {getWeekDates()[0].toDateString()}
      </h1>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ChevronLeft />
          </button>
          <span className="font-bold text-lg">
            Week {getWeekDates()[0].toDateString()}
          </span>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <DragDropContext
        onDragEnd={(result) => {
          const { destination, source } = result;
          if (!destination) return;

          const updatedTasks = Array.from(tasks);
          const [movedTask] = updatedTasks.splice(source.index, 1);
          updatedTasks.splice(destination.index, 0, movedTask);

          setTasks(updatedTasks);
        }}
      >
        {getWeekDates().map((date, index) => {
          const dateTasks = tasks.filter(
            (task) => task.date === date.toDateString()
          );

          return (
            <div key={index} className="mb-4">
              <div className="font-bold text-lg mb-2 flex justify-between items-center">
                <span>{date.toDateString()}</span>
                <button
                  onClick={() => addNewTask(date)}
                  className="p-1 bg-white text-black rounded-full border border-black"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
              <Droppable droppableId={`taskList-${index}`}>
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef}>
                    {dateTasks.map((task, idx) => {
                      const goal = goals.find((g) => g.id === task.goalId);

                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
                          index={idx}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between mb-2"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleTaskCompletion(task.id)}
                                  className="mr-2"
                                />
                                <span>{task.title}</span>

                                {/* Show goal with color if the task is assigned to a goal */}
                                {goal && (
                                  <span className="ml-2 flex items-center">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: goal.color }}
                                    ></div>
                                    <span className="ml-1 text-xs text-gray-500">
                                      ({goal.title})
                                    </span>
                                  </span>
                                )}
                              </div>

                              {/* Edit Button */}
                              <button
                                className="ml-4 p-1 text-blue-500"
                                onClick={() => openEditModal(task)}
                              >
                                <Edit size={18} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </div>
          );
        })}
      </DragDropContext>

      {/* Modal for editing tasks */}
      {isEditModalOpen && selectedTask && (
        <Modal title="Edit Task" onClose={closeEditModal}>
          <input
            type="text"
            value={selectedTask.title}
            onChange={(e) =>
              setSelectedTask({ ...selectedTask, title: e.target.value })
            }
            className="p-2 border border-gray-300 rounded"
          />

          <textarea
            placeholder="Add some extra notes here..."
            value={selectedTask.subnote || ''}
            onChange={(e) =>
              setSelectedTask({ ...selectedTask, subnote: e.target.value })
            }
            className="p-2 border border-gray-300 rounded w-full mt-2"
          />

          <div className="mt-4">
            <label>Reschedule:</label>
            <input
              type="date"
              value={selectedTask.date}
              onChange={(e) =>
                setSelectedTask({ ...selectedTask, date: e.target.value })
              }
              className="p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mt-4">
            <label>Set Recurrence:</label>
            <select
              onChange={(e) =>
                setSelectedTask({
                  ...selectedTask,
                  recurrence: e.target.value,
                })
              }
              className="p-2 border border-gray-300 rounded"
              value={selectedTask.recurrence || ''}
            >
              <option value="">No Recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {selectedTask.recurrence && (
            <div className="mt-4">
              <label>Until:</label>
              <input
                type="date"
                value={selectedTask.until || ''}
                onChange={(e) =>
                  setSelectedTask({ ...selectedTask, until: e.target.value })
                }
                className="p-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <div className="mt-4">
            <label>Assign to Goal:</label>
            <select
              value={selectedTask.goalId || ''}
              onChange={(e) =>
                setSelectedTask({ ...selectedTask, goalId: e.target.value })
              }
              className="p-2 border border-gray-300 rounded"
            >
              <option value="">No Goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => {
                if (selectedTask.recurrence) {
                  handleSetRecurringTask(selectedTask);
                } else {
                  setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                      task.id === selectedTask.id ? selectedTask : task
                    )
                  );
                }
                closeEditModal();
              }}
              className="p-2 bg-green-500 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTasks((prevTasks) =>
                  prevTasks.filter((task) => task.id !== selectedTask.id)
                );
                closeEditModal();
              }}
              className="p-2 bg-red-500 text-white rounded"
            >
              Delete Task
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// GoalsPage Component


const GoalsPage = ({ goals, setGoals }) => {
  const [newGoal, setNewGoal] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(1);
  const [newGoalColor, setNewGoalColor] = useState('#FF5733');

  // Function to add a new goal
  const addGoal = () => {
    if (newGoal) {
      const newGoalObject = {
        id: Date.now(), // Unique ID
        title: newGoal, // Goal title
        target: newGoalTarget, // How many times per week
        color: newGoalColor, // Color selected
        progress: 0 // Initial progress
      };

      // Add new goal to state
      setGoals(prevGoals => [...prevGoals, newGoalObject]);

      // Reset form inputs after adding
      setNewGoal('');
      setNewGoalTarget(1);
      setNewGoalColor('#FF5733');
    }
  };

  // Function to delete a goal
  const deleteGoal = (goalId) => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
  };

  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Weekly Goals</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {/* Display each goal with color circle, progress, and delete button */}
        {goals.map(goal => (
          <div key={goal.id} className="mb-4">
            <div className="flex items-center space-x-2">
              {/* Display the color circle */}
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              {/* Display the goal title and progress */}
              <span>{goal.title} ({goal.progress}/{goal.target})</span>
              {/* Delete button */}
              <button onClick={() => deleteGoal(goal.id)} className="p-1 text-red-500">
                <Trash size={18} />
              </button>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="h-2.5 rounded-full" style={{ backgroundColor: goal.color, width: `${(goal.progress / goal.target) * 100}%` }}></div>
            </div>
          </div>
        ))}

        {/* Input form to add new goal */}
        <input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="New Goal"
          className="p-2 border border-gray-300 rounded mt-4 w-full"
        />
        <div className="mt-4">
          <label>How many times per week:</label>
          <input
            type="number"
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded"
            min="1"
            max="7"
          />
        </div>

        <div className="mt-4">
          <label>Choose Color:</label>
          <div className="flex space-x-2">
            {['#FF5733', '#33FF57', '#3357FF', '#F0FF33', '#FF33F0', '#33FFF0', '#FFA833', '#AA33FF', '#33FFAA', '#FF3333'].map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full ${newGoalColor === color ? 'ring-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewGoalColor(color)}
              />
            ))}
          </div>
        </div>

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
    darkMode: false,
  });

  // Load data from localStorage when the app initializes
  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    const storedGoals = localStorage.getItem('goals');
    const storedSettings = localStorage.getItem('settings');
    const storedStreak = localStorage.getItem('streak');

    if (storedTasks) setTasks(JSON.parse(storedTasks));
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    if (storedSettings) setSettings(JSON.parse(storedSettings));
    if (storedStreak) setStreak(JSON.parse(storedStreak));
  }, []);

  // Save data to localStorage whenever tasks, goals, or settings change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('streak', JSON.stringify(streak));
  }, [streak]);

  // Add this useEffect to apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleSetRecurringTask = useCallback((task) => {
    const updatedTasks = tasks.filter(
      (t) => t.id !== task.id && t.originalTaskId !== task.id
    );

    const originalDate = new Date(task.date);
    const untilDate = task.until ? new Date(task.until + 'T23:59:59') : null;

    let i = 0;
    let recurrenceDate = new Date(originalDate);

    while (!untilDate || recurrenceDate <= untilDate) {
      const newTask = {
        ...task,
        id: Date.now() + i,
        date: recurrenceDate.toDateString(),
        originalTaskId: task.id,
        label: task.label,
      };

      updatedTasks.push(newTask);

      if (task.recurrence === 'daily') {
        recurrenceDate.setDate(recurrenceDate.getDate() + 1);
      } else if (task.recurrence === 'weekly') {
        recurrenceDate.setDate(recurrenceDate.getDate() + 7);
      } else if (task.recurrence === 'monthly') {
        recurrenceDate.setMonth(recurrenceDate.getMonth() + 1);
      } else {
        break;
      }

      i++;
    }

    setTasks(updatedTasks);
  }, [tasks, setTasks]);

  return (
    <div className={`max-w-md mx-auto ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} h-screen flex flex-col`}>
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
  />
)}
{currentView === 'log' && (
  <LogView
    tasks={tasks}
    setTasks={setTasks}
    goals={goals}
    handleSetRecurringTask={handleSetRecurringTask}
  />
)}
{currentView === 'goals' && (
  <GoalsPage
    goals={goals}
    setGoals={setGoals}
    tasks={tasks}
    handleSetRecurringTask={handleSetRecurringTask}
  />
)}
{currentView === 'settings' && (
  <SettingsView settings={settings} setSettings={setSettings} />
)}

      </div>
      <div className={`flex justify-around items-center p-4 ${settings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <button onClick={() => setCurrentView('home')} className="p-2 bg-green-200 rounded"><Home /></button>
        <button onClick={() => setCurrentView('log')} className="p-2 bg-purple-200 rounded"><BookOpen /></button>
        <button onClick={() => setCurrentView('goals')} className="p-2 bg-blue-200 rounded"><Target /></button>
        <button onClick={() => setCurrentView('settings')} className="p-2 bg-purple-200 rounded"><Settings /></button>
      </div>
    </div>
  );
};


export default App;
