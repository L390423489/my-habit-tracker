// LogView.js

import React, { useState, useEffect, useRef } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import {
  PlusCircle,
  GripVertical,
  Clock,
  Bookmark,
} from 'lucide-react';
import typewriterSound from '../sounds/typewriter.wav';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const LogView = ({
  tasks,
  setTasks,
  goals,
  setGoals,
  openEditModal,
  handleSetRecurringTask,
  settings,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const typewriterSoundRef = useRef(null);

  const dayRefs = useRef({}); // To hold references to day containers

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    const weekStartsOn = settings?.weekStartsOn === 'Sun' ? 0 : 1; // 0 for Sunday, 1 for Monday
    const day = startOfWeek.getDay();
    const diff =
      startOfWeek.getDate() -
      day +
      (day === 0 && weekStartsOn === 1 ? -6 : weekStartsOn);
    startOfWeek.setDate(diff);
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
    const dateString = getDateString(date);
    const newTask = {
      id: Date.now().toString(),
      title: `New Task on ${dateString}`,
      completed: false,
      dates: [dateString],
      time: '',
      recurrence: null,
      label: '',
      goalId: '',
      order: 0,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    openEditModal(newTask);
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Extract the task id from draggableId
    const [taskId] = draggableId.split('-');

    setTasks((prevTasks) => {
      // Create a deep clone of prevTasks to avoid mutations
      const tasksCopy = prevTasks.map((task) => ({
        ...task,
        dates: [...task.dates],
      }));

      // Find the task being moved
      const taskIndex = tasksCopy.findIndex((task) => task.id === taskId);

      if (taskIndex === -1) return prevTasks;

      const movedTask = tasksCopy[taskIndex];

      const sourceDate = source.droppableId;
      const destDate = destination.droppableId;

      // Remove the task from the source date
      movedTask.dates = movedTask.dates.filter((date) => date !== sourceDate);

      // Add the task to the destination date
      if (!movedTask.dates.includes(destDate)) {
        movedTask.dates.push(destDate);
      }

      // Update the order for tasks in the destination date
      const tasksInDestDate = tasksCopy
        .filter((task) => task.dates.includes(destDate) && task.id !== taskId)
        .sort((a, b) => a.order - b.order);

      // Insert the moved task into the destination array at the new index
      tasksInDestDate.splice(destination.index, 0, movedTask);

      // Update the order property for tasks in the destination date
      tasksInDestDate.forEach((task, index) => {
        task.order = index;
      });

      // Return the updated tasks array
      return tasksCopy;
    });
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            completed: !task.completed,
          };

          if (updatedTask.completed) {
            playTypewriterSound();
          }

          return updatedTask;
        }
        return task;
      });

      const completedTask = updatedTasks.find(
        (task) => task.id === taskId
      );

      if (completedTask && completedTask.goalId && goals) {
        const relatedGoal = goals.find(
          (goal) => goal.id === completedTask.goalId
        );

        if (relatedGoal) {
          const newProgress = updatedTasks.filter(
            (t) => t.goalId === completedTask.goalId && t.completed
          ).length;
          setGoals((prevGoals) =>
            prevGoals.map((g) =>
              g.id === relatedGoal.id
                ? { ...g, progress: newProgress }
                : g
            )
          );
        }
      }

      return updatedTasks;
    });
  };

  const playTypewriterSound = () => {
    if (settings.sound && typewriterSoundRef.current) {
      typewriterSoundRef.current.currentTime = 0;
      typewriterSoundRef.current.play();
    }
  };

  // Helper function to get goal details
  const getGoalDetails = (goalId) => {
    if (!goals || !Array.isArray(goals)) return null;
    return goals.find((goal) => goal.id === goalId);
  };

  // Helper function to format time
  const formatTime = (time) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Helper function to format date as 'YYYY-MM-DD'
  const getDateString = (date) => date.toLocaleDateString('en-CA');

  // Handle month picker
  const handleMonthChange = (date) => {
    setSelectedDate(new Date(date));
    setShowMonthPicker(false);
  };

  // Handle notes
  const handleSaveNotes = () => {
    // Implement saving notes to localStorage or a state variable
    setShowNotesModal(false);
  };

  // Scroll to today's date on component mount
  useEffect(() => {
    const todayString = getDateString(new Date());
    if (dayRefs.current[todayString]) {
      dayRefs.current[todayString].scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [selectedDate]);

  // Custom DayContent component for DayPicker to show important tasks and background colors
  const CustomDayContent = (day) => {
    const dateString = getDateString(day.date);
    const dayTasks = tasks.filter(
      (task) => task.dates && task.dates.includes(dateString)
    );

    const importantTaskExists = dayTasks.some(
      (task) => task.important
    );
    const backgroundTasks = dayTasks.filter(
      (task) => task.backgroundColor
    );

    return (
      <div className="relative">
        {backgroundTasks.map((task, index) => (
          <div
            key={index}
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: task.backgroundColor }}
          ></div>
        ))}
        <div className="relative z-10">{day.date.getDate()}</div>
        {importantTaskExists && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 bg-gray-100">
      {/* Header with Month Title and Notes Button */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-bold cursor-pointer"
          onClick={() => setShowMonthPicker(true)}
        >
          {getMonthName(selectedDate)}
        </h1>
        <button
          onClick={() => setShowNotesModal(true)}
          className="p-1 bg-white text-black rounded-full border border-black"
        >
          <Bookmark size={20} />
        </button>
      </div>

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleMonthChange}
              fromYear={2000}
              toYear={2030}
              captionLayout="dropdown"
              onMonthChange={(month) =>
                setSelectedDate(new Date(month))
              }
              components={{
                DayContent: CustomDayContent,
              }}
            />
            <button
              onClick={() => setShowMonthPicker(false)}
              className="mt-2 bg-blue-500 text-white p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-2">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-64 border border-gray-300 rounded p-2"
              placeholder="Write your notes here..."
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setShowNotesModal(false)}
                className="bg-gray-300 text-black p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="bg-green-500 text-white p-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-2 mb-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => changeWeek(-1)}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            &lt;
          </button>
          <span className="font-bold text-md">
            Week of {getWeekDates()[0].toDateString()}
          </span>
          <button
            onClick={() => changeWeek(1)}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            &gt;
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {getWeekDates().map((date, index) => {
          const dateString = getDateString(date);
          const dateTasks = tasks
            .filter(
              (task) => task.dates && task.dates.includes(dateString)
            )
            .sort(
              (a, b) => a.order - b.order || a.id.localeCompare(b.id)
            );

          const isToday = dateString === getDateString(new Date());

          return (
            <div
              key={index}
              className="mb-4"
              ref={(el) => (dayRefs.current[dateString] = el)}
            >
              <div
                className={`font-bold text-sm mb-2 flex justify-between items-center ${
                  isToday ? 'text-blue-500' : ''
                }`}
              >
                <span>{date.toDateString()}</span>
                <button
                  onClick={() => addNewTask(date)}
                  className="p-1 bg-white text-black rounded-full border border-black"
                >
                  <PlusCircle size={16} />
                </button>
              </div>
              <Droppable droppableId={dateString}>
                {(provided, snapshot) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[30px] p-2 bg-white rounded-lg shadow ${
                      snapshot.isDraggingOver ? 'bg-blue-100' : ''
                    }`}
                  >
                    {dateTasks.map((task, idx) => {
                      const goalDetails = getGoalDetails(task.goalId);
                      return (
                        <Draggable
                          key={`${task.id}-${dateString}`}
                          draggableId={`${task.id}-${dateString}`}
                          index={idx}
                        >
                          {(provided, snapshot) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center justify-between mb-2 p-1 ${
                                task.completed
                                  ? 'line-through text-gray-500 opacity-50'
                                  : ''
                              } ${
                                snapshot.isDragging
                                  ? 'bg-gray-100'
                                  : 'bg-white'
                              }`}
                              onDoubleClick={() => openEditModal(task)}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() =>
                                    toggleTaskCompletion(task.id)
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm">
                                  {task.time && (
                                    <span className="mr-1">
                                      {formatTime(task.time)}
                                    </span>
                                  )}
                                  {task.title}
                                  {goalDetails && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      ({goalDetails.title})
                                    </span>
                                  )}
                                  {task.important && (
                                    <span className="ml-1 text-red-500 font-bold">
                                      *
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center">
                                {task.reminders &&
                                  task.reminders.length > 0 && (
                                    <Clock
                                      size={16}
                                      className="inline mr-1"
                                    />
                                  )}
                                {goalDetails && goalDetails.color && (
                                  <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{
                                      backgroundColor:
                                        goalDetails.color,
                                    }}
                                  ></div>
                                )}
                                <GripVertical size={16} />
                              </div>
                            </li>
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

      <audio ref={typewriterSoundRef} src={typewriterSound} />
    </div>
  );
};

export default LogView;