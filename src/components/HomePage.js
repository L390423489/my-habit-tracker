// HomePage.js

import React, { useRef, useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings,
  X as CloseIcon,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import successSound from '../sounds/success_sound.wav';
import typewriterSound from '../sounds/typewriter.wav';
import { getEncouragingPhrase, getEmojiByWeek } from '../utils/helpers';
// Import Capacitor's Local Notifications
import { LocalNotifications } from '@capacitor/local-notifications';

const HomePage = ({
  tasks = [],
  setTasks,
  goals = [],
  setGoals,
  handleSetRecurringTask,
  openEditModal,
  settings = {
    weekStartsOn: 'Mon',
    darkMode: false,
    sound: true,
    notifications: true,
    vibration: true,
    enableDailyReminders: true,
    dailyReminders: ['08:00', '20:00'],
    streakSavers: 2,
  },
  setSettings,
  streak = 0,
  setStreak,
}) => {
  // Helper functions
  const getDateString = (date) => date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

  // Helper function to get the week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date - firstDayOfYear + 86400000) / 86400000;
    return Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay()) / 7
    );
  };

  const getGoalDetails = (goalId) => {
    if (!goals || !Array.isArray(goals)) return null;
    return goals.find((goal) => goal.id === goalId);
  };

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

  const soundRef = useRef(null); // For success sound
  const typewriterSoundRef = useRef(null); // For typewriter sound

  // State variables
  const [weeksCompleted, setWeeksCompleted] = useState(1); // Start from week 1
  const [daysMarkedAsDone, setDaysMarkedAsDone] = useState([]);
  const [encouragingPhrase, setEncouragingPhrase] = useState(
    getEncouragingPhrase()
  );
  const [currentEmoji, setCurrentEmoji] = useState(
    getEmojiByWeek(weeksCompleted)
  );
  const [buttonText, setButtonText] = useState('Mark day as done');
  const [buttonColor, setButtonColor] = useState('bg-blue-500');
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdInterval, setHoldInterval] = useState(null);
  const [animateStreak, setAnimateStreak] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // For week navigation
  const [showStreakSaverPopup, setShowStreakSaverPopup] = useState(false);
  const [streakSaversUsed, setStreakSaversUsed] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings modal

  const prevStreakRef = useRef(streak);
  const prevWeekNumberRef = useRef(getWeekNumber(new Date()));

  // Initialize streak savers from settings or start with 2
  const [streakSavers, setStreakSavers] = useState(
    settings.streakSavers !== undefined ? settings.streakSavers : 2
  );

  // New State Variables for Testing Mode
  const [testingMode, setTestingMode] = useState(false);
  const [testCurrentDate, setTestCurrentDate] = useState(null);

  // Helper function to get the current date, considering testing mode
  const getCurrentDate = () => {
    if (testingMode && testCurrentDate) {
      return new Date(testCurrentDate);
    }
    return new Date();
  };

  // Use 🌞 as the streak saver icon
  const streakSaverIcon = '🌞';

  // Store scheduled reminder notification IDs
  const [reminderNotificationIds, setReminderNotificationIds] = useState([]);

  useEffect(() => {
    setEncouragingPhrase(getEncouragingPhrase());
  }, [weeksCompleted]);

  useEffect(() => {
    if (streak !== prevStreakRef.current) {
      // Trigger streak animation
      setAnimateStreak(true);
      setTimeout(() => setAnimateStreak(false), 1000); // Duration of animation
      prevStreakRef.current = streak;
    }
  }, [streak]);

  // Ensure that goals is always an array
  useEffect(() => {
    if (!goals || !Array.isArray(goals)) {
      console.warn('goals is not an array, resetting to empty array');
      setGoals([]);
    }
  }, [goals, setGoals]);

  // Effect to check for week change
  useEffect(() => {
    const checkWeekChange = () => {
      const currentDate = getCurrentDate(); // Use helper function
      const currentWeekNumber = getWeekNumber(currentDate);
      if (currentWeekNumber !== prevWeekNumberRef.current) {
        // Week has changed
        // Check if all goals were achieved and there are goals for the week
        const allGoalsAchieved =
          goals && goals.length > 0
            ? goals.every((goal) => goal.progress >= goal.target)
            : false;

        if (allGoalsAchieved) {
          setWeeksCompleted(
            (prevWeeksCompleted) => prevWeeksCompleted + 1
          );
          setCurrentEmoji(
            getEmojiByWeek(weeksCompleted + 1)
          );

          // Award a streak saver
          setStreakSavers((prevStreakSavers) => {
            const newStreakSavers = prevStreakSavers + 1;
            setSettings((prevSettings) => ({
              ...prevSettings,
              streakSavers: newStreakSavers,
            }));
            return newStreakSavers;
          });
          setShowStreakSaverPopup(true);
        }

        // Reset goals progress for the new week
        setGoals((prevGoals) =>
          prevGoals.map((goal) => ({ ...goal, progress: 0 }))
        );

        // Reset other state for the new week
        setDaysMarkedAsDone([]);
        prevWeekNumberRef.current = currentWeekNumber;
      }
    };

    checkWeekChange(); // Run on component mount

    const interval = setInterval(checkWeekChange, 60 * 1000); // Check every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, [goals, weeksCompleted, setSettings, setGoals, getCurrentDate]);

  // Effect to use streak saver if previous day was not marked as done
  useEffect(() => {
    const today = getCurrentDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayString = getDateString(yesterday);

    if (
      streak > 0 &&
      !daysMarkedAsDone.includes(yesterdayString) &&
      streakSavers > 0 &&
      !isDateInFuture(yesterday) &&
      !streakSaversUsed.includes(yesterdayString)
    ) {
      // Use a streak saver
      setDaysMarkedAsDone((prevDays) => [
        ...prevDays,
        yesterdayString,
      ]);
      setStreakSavers((prevStreakSavers) => {
        const newStreakSavers = prevStreakSavers - 1;
        setSettings((prevSettings) => ({
          ...prevSettings,
          streakSavers: newStreakSavers,
        }));
        return newStreakSavers;
      });
      setStreakSaversUsed((prevUsed) => [
        ...prevUsed,
        yesterdayString,
      ]);
    }
  }, [
    daysMarkedAsDone,
    streakSavers,
    setSettings,
    streakSaversUsed,
    getCurrentDate,
    streak,
  ]);

  useEffect(() => {
    scheduleDailyReminders();
    return () => cancelDailyReminders();
  }, [
    settings.enableMorningReminder,
    settings.morningReminderTime,
    settings.enableAfternoonReminder,
    settings.afternoonReminderTime,
    settings.enableEveningReminder,
    settings.eveningReminderTime,
  ]);
  
  // Function to schedule daily reminders
  const scheduleDailyReminders = async () => {
    // Cancel existing reminders
    await cancelDailyReminders();
  
    const ids = [];
    const now = new Date();
  
    // Morning Reminder
    if (settings.enableMorningReminder && settings.morningReminderTime) {
      const [hour, minute] = settings.morningReminderTime.split(':').map(Number);
      let reminderDate = new Date();
      reminderDate.setHours(hour, minute, 0, 0);
      if (reminderDate < now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      const notificationId = Math.floor(Math.random() * 100000);
      ids.push(notificationId);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Morning Reminder",
            body: "Good morning! Check your tasks for today.",
            id: notificationId,
            schedule: { at: reminderDate, repeats: true, every: 'day' },
            sound: settings.sound ? 'default' : null,
          },
        ],
      });
    }
  
    // Afternoon Reminder
    if (settings.enableAfternoonReminder && settings.afternoonReminderTime) {
      const [hour, minute] = settings.afternoonReminderTime.split(':').map(Number);
      let reminderDate = new Date();
      reminderDate.setHours(hour, minute, 0, 0);
      if (reminderDate < now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      const notificationId = Math.floor(Math.random() * 100000);
      ids.push(notificationId);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Afternoon Reminder",
            body: "Good afternoon! Keep up with your tasks.",
            id: notificationId,
            schedule: { at: reminderDate, repeats: true, every: 'day' },
            sound: settings.sound ? 'default' : null,
          },
        ],
      });
    }
  
    // Evening Reminder
    if (settings.enableEveningReminder && settings.eveningReminderTime) {
      const [hour, minute] = settings.eveningReminderTime.split(':').map(Number);
      let reminderDate = new Date();
      reminderDate.setHours(hour, minute, 0, 0);
      if (reminderDate < now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      const notificationId = Math.floor(Math.random() * 100000);
      ids.push(notificationId);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Evening Reminder",
            body: "Good evening! Wrap up your tasks for today.",
            id: notificationId,
            schedule: { at: reminderDate, repeats: true, every: 'day' },
            sound: settings.sound ? 'default' : null,
          },
        ],
      });
    }
  
    setReminderNotificationIds(ids);
  };
  
  // Function to cancel daily reminders
  const cancelDailyReminders = async () => {
    if (reminderNotificationIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: reminderNotificationIds.map((id) => ({ id })),
      });
      setReminderNotificationIds([]);
    }
  };
  
  // Function to schedule task notifications
  const scheduleNotification = async (task) => {
    if (!settings.notifications || !task.reminders) return;

    for (let i = 0; i < task.reminders.length; i++) {
      const reminderTime = task.reminders[i];
      const reminderDate = new Date(reminderTime);

      if (reminderDate > new Date()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Task Reminder',
              body: task.title,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: reminderDate },
              sound: settings.sound ? 'default' : null,
            },
          ],
        });
      }
    }
  };

  // Function to cancel scheduled task notifications
  const cancelNotification = async (task) => {
    if (task.reminders && task.reminders.length > 0) {
      // Assuming you have stored notification IDs associated with the task
      // You would need to implement storing and retrieving these IDs
    }
  };

  const toggleTaskCompletion = (taskId) => {
    if (isTodayMarkedAsDone) {
      // Prevent toggling tasks if the day is marked as done
      return;
    }

    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            completed: !task.completed,
          };

          // If task is completed, cancel the notifications
          if (updatedTask.completed) {
            cancelNotification(updatedTask);
          } else if (
            updatedTask.reminders &&
            updatedTask.reminders.length > 0
          ) {
            // If task is uncompleted and has reminders, reschedule the notifications
            scheduleNotification(updatedTask);
          }

          if (updatedTask.completed) {
            playTypewriterSound();
          }

          return updatedTask;
        }
        return task;
      });

      if (goals && goals.length > 0) {
        // Update goal progress
        const completedTask = updatedTasks.find(
          (task) => task.id === taskId
        );

        if (completedTask && completedTask.goalId) {
          const relatedGoal = goals.find(
            (goal) => goal.id === completedTask.goalId
          );

          if (relatedGoal) {
            const newProgress = updatedTasks.filter(
              (t) =>
                t.goalId === completedTask.goalId && t.completed
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
      }

      return updatedTasks;
    });
  };

  const playSound = () => {
    if (settings.sound && soundRef.current) {
      soundRef.current.currentTime = 0; // Reset playback to the beginning
      soundRef.current.play();
    }
  };

  const playTypewriterSound = () => {
    if (settings.sound && typewriterSoundRef.current) {
      typewriterSoundRef.current.currentTime = 0;
      typewriterSoundRef.current.play();
    }
  };

  const onDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return;

    if (destination.index === source.index) return;

    setTasks((prevTasks) => {
      const todayDateString = getDateString(getCurrentDate());
      const tasksForToday = prevTasks
        .filter(
          (task) =>
            task.dates && task.dates.includes(todayDateString)
        )
        .sort(
          (a, b) =>
            a.order - b.order || a.id.localeCompare(b.id)
        );
      const otherTasks = prevTasks.filter(
        (task) =>
          !(
            task.dates &&
            task.dates.includes(todayDateString)
          )
      );

      const [movedTask] = tasksForToday.splice(
        source.index,
        1
      );
      tasksForToday.splice(destination.index, 0, movedTask);

      // Update the order property
      const reorderedTasks = tasksForToday.map(
        (task, index) => ({
          ...task,
          order: index,
        })
      );

      return [...otherTasks, ...reorderedTasks];
    });
  };

  const handleMarkDayAsDone = () => {
    const today = getDateString(getCurrentDate());
    if (!daysMarkedAsDone.includes(today)) {
      setDaysMarkedAsDone((prevDays) => [...prevDays, today]);
      setButtonText('Day completed!');
      setButtonColor('bg-green-500');
      setHoldProgress(0);
      playSound();

      // Update streak
      setStreak((prevStreak) => prevStreak + 1);

      // Reset encouraging phrase
      setEncouragingPhrase(getEncouragingPhrase());
    }
  };

  const handleButtonPress = () => {
    if (isTodayMarkedAsDone) return;

    setButtonText('Hold for 3 seconds');
    setHoldProgress(0);

    const interval = setInterval(() => {
      setHoldProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          handleMarkDayAsDone();
          return 100;
        }
        return prevProgress + 1.67; // Approximate 100% over 60 iterations (~3 seconds)
      });
    }, 50);
    setHoldInterval(interval);
  };

  const handleButtonRelease = () => {
    clearInterval(holdInterval);
    setHoldInterval(null);
    setHoldProgress(0);
    setButtonText('Mark day as done');
  };

  const isDateInFuture = (date) => {
    const today = getCurrentDate();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Week Navigation Functions
  const handlePreviousWeek = () => {
    setCurrentWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeekOffset((prev) => prev + 1);
  };

  const getWeekDates = () => {
    const current = getCurrentDate(); // Use helper function
    const adjustedDate = new Date(current);
    adjustedDate.setDate(current.getDate() + currentWeekOffset * 7);
    const week = [];
    const weekStartsOn = settings && settings.weekStartsOn === 'Sun' ? 0 : 1; // 0 for Sunday, 1 for Monday
    const day = adjustedDate.getDay();
    const diff =
      (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
    const firstDayOfWeek = new Date(adjustedDate);
    firstDayOfWeek.setDate(adjustedDate.getDate() - diff);
    firstDayOfWeek.setHours(0, 0, 0, 0); // Set time to midnight
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const weekDates = getWeekDates();

  const todayDateString = getDateString(getCurrentDate());
  const todayTasks = tasks
    .filter(
      (task) =>
        task.dates && task.dates.includes(todayDateString)
    )
    .sort(
      (a, b) => a.order - b.order || a.id.localeCompare(b.id)
    );

  const allTasksCompleted =
    todayTasks.length > 0 &&
    todayTasks.every((task) => task.completed);

  const isTodayMarkedAsDone =
    daysMarkedAsDone.includes(todayDateString);

  return (
    <div
      className={`p-4 ${
        settings.darkMode
          ? 'bg-gray-900 text-gray-100'
          : 'bg-gray-100 text-black'
      } relative`}
    >
      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className={`absolute top-4 right-4 ${
          settings.darkMode
            ? 'text-gray-300 hover:text-white'
            : 'text-gray-600 hover:text-gray-800'
        }`}
        title="Settings"
      >
        <Settings size={24} />
      </button>

      {/* Rest of your component */}
      <h1 className="text-2xl font-bold mb-4">Weekly Bloom!</h1>

      {/* Display Streak Savers under the heading */}
      <div className="flex items-center justify-start mb-4">
        <span className="mr-2">Streak Savers:</span>
        {streakSavers > 0 ? (
          <span className="text-2xl">
            {Array(streakSavers).fill(streakSaverIcon).join('')}
          </span>
        ) : (
          <span>No streak savers</span>
        )}
      </div>

      {/* Streak Overview Section */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center ${
              animateStreak ? 'animate-streak' : ''
            } ${
              settings.darkMode ? 'bg-gray-800' : 'bg-green-200'
            }`}
          >
            <span className="text-4xl font-bold">{streak}</span>
          </div>
          <span className="text-6xl absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
            {currentEmoji}
          </span>
        </div>
        <span className="text-xl mt-2">Week {weeksCompleted}</span>
        <p
          className={`mt-2 text-center ${
            settings.darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          {encouragingPhrase}
        </p>
      </div>

      {/* Week Navigation Arrows */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePreviousWeek}>
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold">
          {weekDates[0].toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}{' '}
          -{' '}
          {weekDates[6].toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </h2>
        <button onClick={handleNextWeek}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Week Day Selector */}
      <div className="flex justify-between mb-4">
        {weekDates && weekDates.length > 0 ? (
          weekDates.map((date, index) => {
            const dateString = getDateString(date);
            const isToday = dateString === todayDateString;
            const isDayMarkedAsDone = daysMarkedAsDone.includes(dateString);
            const isDaySavedByStreakSaver = streakSaversUsed.includes(dateString);

            const tasksForDate =
              tasks && tasks.length > 0
                ? tasks.filter(
                    (task) => task.dates && task.dates.includes(dateString)
                  )
                : [];

            const hasImportantTask = tasksForDate.some((task) => task.important);

            const tasksWithBackground = tasksForDate.filter(
              (task) => task.backgroundColor
            );

            // Change color based on the day
            const dayColorClass = (() => {
              if (isDaySavedByStreakSaver) return 'bg-yellow-500';
              if (isDayMarkedAsDone) return 'bg-green-500';
              if (isToday) return 'bg-blue-500';
              return settings.darkMode ? 'bg-gray-700' : 'bg-gray-200';
            })();

            return (
              <div
                key={index}
                className="flex flex-col items-center relative"
              >
                {/* Background colored tasks */}
                {tasksWithBackground.map((task, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 left-0 w-full h-full rounded-full"
                    style={{
                      backgroundColor: task.backgroundColor,
                      opacity: 0.3,
                    }}
                  ></div>
                ))}

                <span className="text-xs mb-1 relative z-10">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <div
                  className={`w-10 h-10 rounded-full relative ${dayColorClass} flex items-center justify-center`}
                >
                  <span className="text-sm relative z-10">
                    {date.getDate()}
                  </span>
                  {hasImportantTask && (
                    <div className="w-2 h-2 bg-red-500 rounded-full absolute bottom-0"></div>
                  )}
                  {isDaySavedByStreakSaver && (
                    <span className="absolute bottom-0 text-sm">
                      {streakSaverIcon}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div>No dates available</div>
        )}
      </div>

      

       {/* Display Today's Date */}
       <h2 className="text-lg font-semibold mb-2">
            {getCurrentDate().toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              weekday: 'short',
            })}
          </h2>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="taskList">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`min-h-[50px] p-1 rounded-lg shadow mb-2 ${
                    settings.darkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  {todayTasks.map((task, idx) => {
                    const goalDetails = getGoalDetails(task.goalId);
                    return (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={idx}
                      >
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex justify-between items-center p-1 mb-1 shadow-sm rounded-lg ${
                              task.completed
                                ? 'line-through text-gray-500 opacity-50'
                                : ''
                            } ${
                              settings.darkMode
                                ? 'bg-gray-900 text-gray-100'
                                : 'bg-white text-black'
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
                                disabled={isTodayMarkedAsDone}
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
                              {/* Clock icon if any reminders are set */}
                              {task.reminders &&
                                task.reminders.length > 0 && (
                                  <Clock
                                    size={16}
                                    className="inline mr-1"
                                  />
                                )}
                              {goalDetails && (
                                <div
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{
                                    backgroundColor: goalDetails.color,
                                  }}
                                ></div>
                              )}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab"
                              >
                                <GripVertical size={16} />
                              </div>
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
          </DragDropContext>

          {/* Mark Day as Done Button */}
          {allTasksCompleted && (
            <button
              onMouseDown={
                !isTodayMarkedAsDone ? handleButtonPress : undefined
              }
              onMouseUp={
                !isTodayMarkedAsDone ? handleButtonRelease : undefined
              }
              onMouseLeave={
                !isTodayMarkedAsDone ? handleButtonRelease : undefined
              }
              className={`${
                isTodayMarkedAsDone ? 'bg-green-500' : buttonColor
              } text-white px-4 py-2 rounded mt-4 w-full relative overflow-hidden`}
            >
              {isTodayMarkedAsDone ? 'Day completed!' : buttonText}
              {!isTodayMarkedAsDone && (
                <div
                  className="absolute left-0 top-0 h-full bg-white opacity-25"
                  style={{ width: `${holdProgress}%` }}
                ></div>
              )}
            </button>
          )}

          {/* Streak Saver Popup */}
          {showStreakSaverPopup && (
            <div
              className={`fixed inset-0 flex items-center justify-center ${
                settings.darkMode
                  ? 'bg-gray-900 bg-opacity-80'
                  : 'bg-black bg-opacity-50'
              }`}
            >
              <div
                className={`rounded-lg shadow-lg p-4 ${
                  settings.darkMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-black'
                }`}
              >
                <p className="text-center mb-4 text-lg">
                  {streakSaverIcon} You got a Streak Saver to help you save
                  your streak!
                </p>
                <button
                  onClick={() => setShowStreakSaverPopup(false)}
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Settings Modal */}
          {isSettingsOpen && (
            <div
              className={`fixed inset-0 ${
                settings.darkMode
                  ? 'bg-gray-900 bg-opacity-80'
                  : 'bg-gray-500 bg-opacity-50'
              } flex justify-center items-center z-50`}
            >
              <div
                className={`rounded-lg shadow-lg p-6 w-96 relative ${
                  settings.darkMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-black'
                }`}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  title="Close"
                >
                  <CloseIcon size={20} />
                </button>
                {/* Settings Content */}
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <div className="mb-4">
                  <label className="block mb-2">Week Starts On:</label>
                  <select
                    value={settings.weekStartsOn}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        weekStartsOn: e.target.value,
                      })
                    }
                    className={`w-full p-2 border rounded ${
                      settings.darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-black'
                    }`}
                  >
                    <option value="Mon">Monday</option>
                    <option value="Sun">Sunday</option>
                  </select>
                </div>
                {/* Testing Mode Toggle */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={testingMode}
                      onChange={(e) => setTestingMode(e.target.checked)}
                      className="mr-2"
                    />
                    Enable Testing Mode
                  </label>
                </div>
                {/* Date Picker for Testing Mode */}
                {testingMode && (
                  <div className="mb-4">
                    <label className="block mb-2">Set Current Date:</label>
                    <input
                      type="date"
                      value={
                        testCurrentDate
                          ? getDateString(new Date(testCurrentDate))
                          : ''
                      }
                      onChange={(e) => setTestCurrentDate(e.target.value)}
                      className={`w-full p-2 border rounded ${
                        settings.darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-black'
                      }`}
                    />
                  </div>
                )}
                {/* Morning Reminder */}
<div className="mb-4">
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={settings.enableMorningReminder}
      onChange={(e) =>
        setSettings({
          ...settings,
          enableMorningReminder: e.target.checked,
        })
      }
      className="mr-2"
    />
    Enable Morning Reminder
  </label>
  {settings.enableMorningReminder && (
    <div className="mt-2">
      <label className="block mb-1">Time:</label>
      <input
        type="time"
        value={settings.morningReminderTime}
        onChange={(e) =>
          setSettings({
            ...settings,
            morningReminderTime: e.target.value,
          })
        }
        className={`w-full p-2 border rounded ${
          settings.darkMode
            ? 'bg-gray-700 text-white'
            : 'bg-white text-black'
        }`}
      />
    </div>
  )}
</div>

{/* Afternoon Reminder */}
<div className="mb-4">
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={settings.enableAfternoonReminder}
      onChange={(e) =>
        setSettings({
          ...settings,
          enableAfternoonReminder: e.target.checked,
        })
      }
      className="mr-2"
    />
    Enable Afternoon Reminder
  </label>
  {settings.enableAfternoonReminder && (
    <div className="mt-2">
      <label className="block mb-1">Time:</label>
      <input
        type="time"
        value={settings.afternoonReminderTime}
        onChange={(e) =>
          setSettings({
            ...settings,
            afternoonReminderTime: e.target.value,
          })
        }
        className={`w-full p-2 border rounded ${
          settings.darkMode
            ? 'bg-gray-700 text-white'
            : 'bg-white text-black'
        }`}
      />
    </div>
  )}
</div>

{/* Evening Reminder */}
<div className="mb-4">
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={settings.enableEveningReminder}
      onChange={(e) =>
        setSettings({
          ...settings,
          enableEveningReminder: e.target.checked,
        })
      }
      className="mr-2"
    />
    Enable Evening Reminder
  </label>
  {settings.enableEveningReminder && (
    <div className="mt-2">
      <label className="block mb-1">Time:</label>
      <input
        type="time"
        value={settings.eveningReminderTime}
        onChange={(e) =>
          setSettings({
            ...settings,
            eveningReminderTime: e.target.value,
          })
        }
        className={`w-full p-2 border rounded ${
          settings.darkMode
            ? 'bg-gray-700 text-white'
            : 'bg-white text-black'
        }`}
      />
    </div>
  )}
</div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: e.target.checked,
                        })
                      }
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
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sound: e.target.checked,
                        })
                      }
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
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          vibration: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Enable Vibration
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          darkMode: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Enable Dark Mode
                  </label>
                </div>
              </div>
            </div>
          )}

          <audio ref={soundRef} src={successSound} />
          <audio ref={typewriterSoundRef} src={typewriterSound} />
        </div>
      );
    };

    export default HomePage;