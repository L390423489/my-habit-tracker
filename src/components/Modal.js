// Modal.js

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
// Import Capacitor's Local Notifications
import { LocalNotifications } from '@capacitor/local-notifications';

const Modal = ({
  title,
  onClose,
  task,
  setTasks,
  goals,
  handleSetRecurringTask,
  settings,
}) => {
  const [editedTask, setEditedTask] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [setEndDate, setSetEndDate] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [deleteOption, setDeleteOption] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);

  // For selecting multiple dates via calendar
  const [selectedDates, setSelectedDates] = useState([]);

  // Reminder scope options for recurring tasks
  const [showReminderScopeOptions, setShowReminderScopeOptions] = useState(false);
  const [reminderScopeOption, setReminderScopeOption] = useState('');

  // State for new reminder inputs
  const [newReminderOption, setNewReminderOption] = useState('');
  const [newCustomReminder, setNewCustomReminder] = useState('');

  // New state variables for shift functionality
  const [isShift, setIsShift] = useState(false);
  const [shiftDuration, setShiftDuration] = useState('');
  const [shiftLetter, setShiftLetter] = useState('');

  // Helper function to format date as 'YYYY-MM-DD'
  const getDateString = (date) => date.toLocaleDateString('en-CA');

  useEffect(() => {
    const formattedDates = task.dates || [];
    setEditedTask({
      ...task,
      dates: formattedDates,
      reminders: task.reminders || [],
    });
    setSelectedDates(
      formattedDates.map((dateStr) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0); // Ensure time is set to midnight
        return date;
      })
    );
    if (task.until) {
      setSetEndDate(true);
    }
    if (task.selectedWeekdays) {
      setSelectedWeekdays(task.selectedWeekdays);
    }
    // Initialize shift-related state variables
    setIsShift(task.isShift || false);
    setShiftDuration(task.shiftDuration || '');
    setShiftLetter(task.shiftLetter || '');
  }, [task]);

  // Function to schedule notifications
  const scheduleNotification = (task) => {
    if (task.reminders && task.reminders.length > 0) {
      task.reminders.forEach((reminder, index) => {
        let reminderDateTime;
        if (reminder.type === 'custom') {
          reminderDateTime = new Date(reminder.datetime);
        } else {
          // Calculate based on task time and date
          if (!task.time) return; // Cannot schedule non-custom reminder without task time
          const taskDateTime = new Date(`${task.dates[0]}T${task.time}`);
          reminderDateTime = new Date(taskDateTime);
          switch (reminder.type) {
            case 'atEventTime':
              // reminderDateTime is the same as taskDateTime
              break;
            case '10minBefore':
              reminderDateTime.setMinutes(reminderDateTime.getMinutes() - 10);
              break;
            case '30minBefore':
              reminderDateTime.setMinutes(reminderDateTime.getMinutes() - 30);
              break;
            case '1hrBefore':
              reminderDateTime.setHours(reminderDateTime.getHours() - 1);
              break;
            case '1dayBefore':
              reminderDateTime.setDate(reminderDateTime.getDate() - 1);
              break;
            case '2daysBefore':
              reminderDateTime.setDate(reminderDateTime.getDate() - 2);
              break;
            default:
              break;
          }
        }
        // Generate unique notification ID
        const notificationId = parseInt(
          task.id.toString().replace('.', '') + index.toString()
        );
        LocalNotifications.schedule({
          notifications: [
            {
              title: 'Task Reminder',
              body: task.title,
              id: notificationId,
              schedule: { at: reminderDateTime },
              sound: settings && settings.sound ? 'default' : null,
            },
          ],
        });
      });
    }
  };

  // Function to cancel scheduled notifications
  const cancelNotification = (task) => {
    if (task.reminders && task.reminders.length > 0) {
      task.reminders.forEach((reminder, index) => {
        const notificationId = parseInt(
          task.id.toString().replace('.', '') + index.toString()
        );
        LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      });
    }
  };

  const handleAddReminder = () => {
    const newReminder = {
      type: newReminderOption,
    };
    if (newReminderOption === 'custom') {
      newReminder.datetime = newCustomReminder;
    }
    setEditedTask((prevTask) => ({
      ...prevTask,
      reminders: [...prevTask.reminders, newReminder],
    }));
    // Reset the inputs
    setNewReminderOption('');
    setNewCustomReminder('');
  };

  const handleDeleteReminder = (index) => {
    setEditedTask((prevTask) => {
      const updatedReminders = [...prevTask.reminders];
      updatedReminders.splice(index, 1);
      return {
        ...prevTask,
        reminders: updatedReminders,
      };
    });
  };

  const handleSave = () => {
    const updatedTask = {
      ...editedTask,
      dates: selectedDates.map((date) => getDateString(date)),
      isShift,
      shiftDuration,
      shiftLetter,
    };

    // If the task has a recurrence and reminders are being set
    if (updatedTask.recurrence && updatedTask.reminders.length > 0) {
      setShowReminderScopeOptions(true);
      return; // Wait until the user selects the scope
    }

    // Save the task normally if there's no recurrence or reminder scope selection is not needed
    saveTask(updatedTask);
    onClose();
  };

  const saveTask = (updatedTask) => {
    setTasks((prevTasks) => {
      const existingTaskIndex = prevTasks.findIndex((t) => t.id === updatedTask.id);
      if (existingTaskIndex !== -1) {
        const newTasks = [...prevTasks];
        cancelNotification(prevTasks[existingTaskIndex]);
        newTasks[existingTaskIndex] = updatedTask;
        scheduleNotification(updatedTask);
        return newTasks;
      } else {
        scheduleNotification(updatedTask);
        return [...prevTasks, updatedTask];
      }
    });
  };

  const applyReminderToTasks = (updatedTask, scope) => {
    setTasks((prevTasks) => {
      let tasksToUpdate = [];

      if (scope === 'all') {
        // Update all occurrences of the task
        tasksToUpdate = prevTasks.map((task) => {
          if (task.id === updatedTask.id || task.originalTaskId === updatedTask.id) {
            cancelNotification(task); // Cancel existing notifications
            const newTask = {
              ...task,
              ...updatedTask,
            };
            scheduleNotification(newTask); // Schedule new notifications
            return newTask;
          }
          return task;
        });
      } else if (scope === 'future') {
        // Update this and future tasks
        const today = getDateString(new Date());
        tasksToUpdate = prevTasks.map((task) => {
          if (
            (task.id === updatedTask.id || task.originalTaskId === updatedTask.id) &&
            task.dates[0] >= today
          ) {
            cancelNotification(task);
            const newTask = {
              ...task,
              ...updatedTask,
            };
            scheduleNotification(newTask);
            return newTask;
          }
          return task;
        });
      } else {
        // Update only this task
        tasksToUpdate = prevTasks.map((task) => {
          if (task.id === updatedTask.id) {
            cancelNotification(task);
            const newTask = {
              ...task,
              ...updatedTask,
            };
            scheduleNotification(newTask);
            return newTask;
          }
          return task;
        });
      }

      return tasksToUpdate;
    });
  };

  const confirmReminderScope = () => {
    const updatedTask = {
      ...editedTask,
      dates: selectedDates.map((date) => getDateString(date)),
      isShift,
      shiftDuration,
      shiftLetter,
    };

    // Proceed to save the task based on the selected reminder scope
    applyReminderToTasks(updatedTask, reminderScopeOption);

    setShowReminderScopeOptions(false);
    onClose();
  };

  const handleDelete = () => {
    // Cancel notification when deleting a task
    cancelNotification(editedTask);

    if (editedTask.recurrence || editedTask.originalTaskId) {
      setShowDeleteOptions(true);
    } else {
      // Delete only the selected task
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== editedTask.id));
      onClose();
    }
  };

  const confirmDelete = () => {
    const today = getDateString(new Date());
    if (deleteOption === 'this') {
      // Delete only the selected task
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== editedTask.id));
      cancelNotification(editedTask);
    } else if (deleteOption === 'future') {
      // Delete this task and all future occurrences
      setTasks((prevTasks) =>
        prevTasks.filter((t) => {
          if (t.id === editedTask.id) {
            cancelNotification(t);
            return false;
          }
          if (t.originalTaskId === editedTask.originalTaskId) {
            const taskDate = t.dates[0]; // Assuming tasks from recurrence have single date in dates
            if (taskDate >= today) {
              cancelNotification(t);
              return false;
            }
          }
          return true;
        })
      );
    } else if (deleteOption === 'all') {
      // Delete all occurrences
      const taskIdToDelete = editedTask.originalTaskId || editedTask.id;
      setTasks((prevTasks) =>
        prevTasks.filter((t) => {
          if (t.id === taskIdToDelete || t.originalTaskId === taskIdToDelete) {
            cancelNotification(t);
            return false;
          }
          return true;
        })
      );
    }
    setShowDeleteOptions(false);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let updatedValue;

    if (type === 'checkbox') {
      updatedValue = checked;
    } else {
      updatedValue = value;
    }

    setEditedTask((prevTask) => ({
      ...prevTask,
      [name]: updatedValue,
    }));
  };

  const toggleAdvancedOptions = () => setShowAdvanced(!showAdvanced);

  // Helper function to generate recurring tasks
  const generateRecurringTasks = (task) => {
    const newTasks = [];
    const originalDate = new Date(task.dates[0]); // Use the first date
    originalDate.setHours(0, 0, 0, 0); // Set time to midnight
    const untilDate = setEndDate && task.until ? new Date(task.until) : null;
    if (untilDate) {
      untilDate.setHours(23, 59, 59, 999); // Set to end of the day
    }
    let recurrenceDate = new Date(originalDate);

    // Set a maximum number of occurrences to prevent infinite loops
    const maxOccurrences = 1000;
    let occurrenceCount = 0;

    if (task.recurrence === 'custom' && selectedWeekdays.length > 0) {
      // Handle custom recurrence on selected weekdays
      while (!setEndDate || (untilDate && recurrenceDate <= untilDate)) {
        if (selectedWeekdays.includes(recurrenceDate.getDay())) {
          const newTask = {
            ...task,
            id: Date.now().toString() + Math.random(),
            dates: [getDateString(recurrenceDate)],
            originalTaskId: task.id,
          };
          newTasks.push(newTask);
        }
        recurrenceDate.setDate(recurrenceDate.getDate() + 1);
        recurrenceDate.setHours(0, 0, 0, 0); // Reset time to midnight
        occurrenceCount++;
        if (occurrenceCount >= maxOccurrences) break;
      }
    } else {
      // Handle other recurrence types
      while (!setEndDate || (untilDate && recurrenceDate <= untilDate)) {
        const newTask = {
          ...task,
          id: Date.now().toString() + Math.random(),
          dates: [getDateString(recurrenceDate)],
          originalTaskId: task.id,
        };
        newTasks.push(newTask);

        // Handle the recurrence type
        if (task.recurrence === 'daily') {
          recurrenceDate.setDate(recurrenceDate.getDate() + 1);
        } else if (task.recurrence === 'weekly') {
          recurrenceDate.setDate(recurrenceDate.getDate() + 7);
        } else if (task.recurrence === 'monthly') {
          recurrenceDate.setMonth(recurrenceDate.getMonth() + 1);
        } else if (task.recurrence === 'yearly') {
          recurrenceDate.setFullYear(recurrenceDate.getFullYear() + 1);
        } else {
          break;
        }
        recurrenceDate.setHours(0, 0, 0, 0); // Reset time to midnight
        occurrenceCount++;
        if (occurrenceCount >= maxOccurrences) break;
      }
    }
    return newTasks;
  };

  if (!editedTask) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div
        className="bg-white p-4 rounded shadow-lg w-96 relative max-h-full overflow-y-auto"
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {/* Task Title */}
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Task Title
        </label>
        <input
          type="text"
          name="title"
          value={editedTask.title}
          onChange={handleInputChange}
          className="border border-gray-300 rounded w-full p-2 mb-4"
        />

        {/* Important Toggle */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="important"
              checked={editedTask.important || false}
              onChange={handleInputChange}
              className="mr-2"
            />
            Mark as Important
          </label>
        </div>

        {/* Shift Toggle */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isShift"
              checked={isShift}
              onChange={(e) => setIsShift(e.target.checked)}
              className="mr-2"
            />
            Set as Shift
          </label>
        </div>

        {/* Shift Details */}
        {isShift && (
          <>
            {/* Shift Duration */}
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Shift Duration (hours)
            </label>
            <input
              type="number"
              name="shiftDuration"
              min="1"
              max="12"
              value={shiftDuration}
              onChange={(e) => setShiftDuration(e.target.value)}
              className="border border-gray-300 rounded w-full p-2 mb-4"
            />

            {/* Shift Background Color */}
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Shift Background Color
            </label>
            <input
              type="color"
              name="backgroundColor"
              value={editedTask.backgroundColor || '#ffffff'}
              onChange={handleInputChange}
              className="w-full h-10 mb-4 p-0 border-0"
            />

            {/* Letter to Display */}
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Letter to Display on Calendar
            </label>
            <input
              type="text"
              name="shiftLetter"
              maxLength="1"
              value={shiftLetter}
              onChange={(e) => setShiftLetter(e.target.value)}
              className="border border-gray-300 rounded w-full p-2 mb-4"
            />
          </>
        )}

        {/* Dates via Calendar */}
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Dates
        </label>
        <DayPicker
          mode="multiple"
          selected={selectedDates}
          onSelect={setSelectedDates}
          disabled={{ before: new Date() }}
        />
        <div className="mt-2 mb-4">
          <strong>Selected Dates:</strong>
          {selectedDates.length > 0 ? (
            <ul>
              {selectedDates.map((date, index) => (
                <li key={index}>{date.toLocaleDateString()}</li>
              ))}
            </ul>
          ) : (
            <p>No dates selected.</p>
          )}
        </div>

        {/* Time */}
        {!isShift && (
          <>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Time
            </label>
            <input
              type="time"
              name="time"
              value={editedTask.time || ''}
              onChange={handleInputChange}
              className="border border-gray-300 rounded w-full p-2 mb-4"
            />
          </>
        )}

        {/* Goal Assignment */}
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Assign to Goal
        </label>
        <select
          name="goalId"
          value={editedTask.goalId || ''}
          onChange={(e) =>
            setEditedTask({ ...editedTask, goalId: e.target.value })
          }
          className="border border-gray-300 rounded w-full p-2 mb-4"
        >
          <option value="">No Goal</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>

        {/* Toggle Advanced Options */}
        <div className="mb-4">
          <button
            onClick={toggleAdvancedOptions}
            className="text-blue-500 underline"
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {showAdvanced && (
          <>
            {/* Set Recurrence */}
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Set Recurrence
            </label>
            <select
              name="recurrence"
              value={editedTask.recurrence || ''}
              onChange={handleInputChange}
              className="border border-gray-300 rounded w-full p-2 mb-4"
            >
              <option value="">No Recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>

            {/* Custom Recurrence */}
            {editedTask.recurrence === 'custom' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Days of the Week
                </label>
                <div className="flex flex-wrap">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day, index) => (
                      <label key={day} className="flex items-center mr-4 mb-2">
                        <input
                          type="checkbox"
                          name="selectedWeekdays"
                          value={index}
                          checked={selectedWeekdays.includes(index)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (e.target.checked) {
                              setSelectedWeekdays([...selectedWeekdays, value]);
                            } else {
                              setSelectedWeekdays(
                                selectedWeekdays.filter((d) => d !== value)
                              );
                            }
                          }}
                          className="mr-1"
                        />
                        {day}
                      </label>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Set End Date Toggle */}
            {editedTask.recurrence && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setEndDate}
                    onChange={() => setSetEndDate(!setEndDate)}
                    className="mr-2"
                  />
                  Set End Date
                </label>
              </div>
            )}

            {/* End Date Input */}
            {setEndDate && editedTask.recurrence && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  End Recurrence On
                </label>
                <input
                  type="date"
                  name="until"
                  value={editedTask.until || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded w-full p-2"
                />
              </div>
            )}

            {/* Multiple Reminders */}
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Add Reminder
            </label>
            <select
              name="newReminderOption"
              value={newReminderOption}
              onChange={(e) => setNewReminderOption(e.target.value)}
              className="border border-gray-300 rounded w-full p-2 mb-2"
            >
              <option value="">Select Reminder</option>
              <option value="atEventTime">At Event Time</option>
              <option value="10minBefore">10 Minutes Before</option>
              <option value="30minBefore">30 Minutes Before</option>
              <option value="1hrBefore">1 Hour Before</option>
              <option value="1dayBefore">1 Day Before</option>
              <option value="2daysBefore">2 Days Before</option>
              <option value="custom">Custom</option>
            </select>

            {/* Show datetime-local input if 'custom' is selected */}
            {newReminderOption === 'custom' && (
              <input
                type="datetime-local"
                name="newCustomReminder"
                value={newCustomReminder}
                onChange={(e) => setNewCustomReminder(e.target.value)}
                className="border border-gray-300 rounded w-full p-2 mb-2"
              />
            )}

            <button
              onClick={handleAddReminder}
              className="bg-blue-500 text-white p-2 rounded mb-4"
              disabled={
                !newReminderOption ||
                (newReminderOption === 'custom' && !newCustomReminder)
              }
            >
              Add Reminder
            </button>

            {/* List of Reminders */}
            {editedTask.reminders && editedTask.reminders.length > 0 && (
              <div className="mb-4">
                <strong>Reminders:</strong>
                <ul>
                  {editedTask.reminders.map((reminder, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {reminder.type === 'custom'
                          ? `Custom: ${new Date(
                              reminder.datetime
                            ).toLocaleString()}`
                          : reminder.type}
                      </span>
                      <button
                        onClick={() => handleDeleteReminder(index)}
                        className="text-red-500 underline"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Save and Delete Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white p-2 rounded"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-black p-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-500 text-white p-2 rounded"
          >
            Save
          </button>
        </div>

        {/* Delete Options Modal */}
        {showDeleteOptions && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
            <div className="bg-white p-4 rounded shadow-lg w-80">
              <h3 className="text-lg font-semibold mb-4">
                Delete Recurring Task
              </h3>
              <p className="mb-4">Do you want to delete:</p>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="this"
                    onChange={(e) => setDeleteOption(e.target.value)}
                    className="mr-2"
                  />
                  Only this task
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="future"
                    onChange={(e) => setDeleteOption(e.target.value)}
                    className="mr-2"
                  />
                  This and future tasks
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="all"
                    onChange={(e) => setDeleteOption(e.target.value)}
                    className="mr-2"
                  />
                  All occurrences
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteOptions(false)}
                  className="bg-gray-300 text-black p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white p-2 rounded"
                  disabled={!deleteOption}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Scope Options Modal */}
        {showReminderScopeOptions && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
            <div className="bg-white p-4 rounded shadow-lg w-80">
              <h3 className="text-lg font-semibold mb-4">
                Apply Reminder to Recurring Tasks
              </h3>
              <p className="mb-4">Do you want to set the reminder for:</p>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reminderScopeOption"
                    value="this"
                    onChange={(e) => setReminderScopeOption(e.target.value)}
                    className="mr-2"
                  />
                  Only this task
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reminderScopeOption"
                    value="future"
                    onChange={(e) => setReminderScopeOption(e.target.value)}
                    className="mr-2"
                  />
                  This and future tasks
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reminderScopeOption"
                    value="all"
                    onChange={(e) => setReminderScopeOption(e.target.value)}
                    className="mr-2"
                  />
                  All occurrences
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowReminderScopeOptions(false)}
                  className="bg-gray-300 text-black p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReminderScope}
                  className="bg-green-500 text-white p-2 rounded"
                  disabled={!reminderScopeOption}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;