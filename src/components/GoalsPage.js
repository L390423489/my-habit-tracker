// GoalsPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Trash, Edit, PlusCircle, Lock } from 'lucide-react';
import typewriterSound from '../sounds/typewriter.wav';
import { getEmojiByWeek } from '../utils/helpers';

const GoalsPage = ({ goals, setGoals, tasks, weeksCompleted, settings }) => {
  // State for Overall Weekly Progress
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [weeklyTarget, setWeeklyTarget] = useState(0);

  // State for Achievement Popup
  const [isAchievementPopupOpen, setIsAchievementPopupOpen] = useState(false);
  const [popupEmoji, setPopupEmoji] = useState('');
  const [popupMessage, setPopupMessage] = useState('');

  // Ref for audio
  const typewriterSoundRef = useRef(null);

  // State for Add Goal Modal
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(1);
  const [newGoalColor, setNewGoalColor] = useState('#FF5733');

  // State for Edit Goal Modal
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState(null);
  const [editedGoalName, setEditedGoalName] = useState('');
  const [editedGoalTarget, setEditedGoalTarget] = useState(1);
  const [editedGoalColor, setEditedGoalColor] = useState('#FF5733');

  // Function to add a new goal
  const addGoal = () => {
    if (newGoalName.trim() === '') return;

    const newGoalObject = {
      id: Date.now().toString(), // Unique ID as a string
      title: newGoalName,
      target: newGoalTarget, // How many times per week
      color: newGoalColor, // Color selected
      progress: 0, // Initial progress
    };

    setGoals((prevGoals) => [...prevGoals, newGoalObject]);

    // Reset form inputs
    setNewGoalName('');
    setNewGoalTarget(1);
    setNewGoalColor('#FF5733');
    setIsAddGoalModalOpen(false);
  };

  // Function to open edit modal
  const openEditModal = (goal) => {
    setGoalToEdit(goal);
    setEditedGoalName(goal.title);
    setEditedGoalTarget(goal.target);
    setEditedGoalColor(goal.color);
    setIsEditGoalModalOpen(true);
  };

  // Function to save edited goal
  const saveEditedGoal = () => {
    if (editedGoalName.trim() === '') return;

    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalToEdit.id
          ? {
              ...goal,
              title: editedGoalName,
              target: editedGoalTarget,
              color: editedGoalColor,
            }
          : goal
      )
    );

    // Reset edit modal state
    setGoalToEdit(null);
    setEditedGoalName('');
    setEditedGoalTarget(1);
    setEditedGoalColor('#FF5733');
    setIsEditGoalModalOpen(false);
  };

  // Function to delete a goal with confirmation
  const deleteGoal = (goalId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this goal?');
    if (confirmDelete) {
      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
    }
  };

  // Function to calculate and update goal progress based on completed tasks
  const updateGoalProgress = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Assuming week starts on Monday

    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        // Count completed tasks for this goal within the current week
        const completedTasks = tasks.filter((task) => {
          if (task.goalId === goal.id && task.completed) {
            const taskDate = new Date(task.dates[0]);
            return taskDate >= startOfWeek && taskDate <= endOfWeek;
          }
          return false;
        }).length;

        // Update progress
        const newProgress = completedTasks;
        return {
          ...goal,
          progress: newProgress,
        };
      })
    );
  };

  // Calculate weekly overall progress
  const calculateWeeklyOverallProgress = () => {
    const totalProgress = goals.reduce((acc, goal) => acc + goal.progress, 0);
    const totalTarget = goals.reduce((acc, goal) => acc + goal.target, 0);

    setWeeklyProgress(totalProgress);
    setWeeklyTarget(totalTarget);
  };

  // Update progress when tasks or goals change
  useEffect(() => {
    updateGoalProgress();
  }, [tasks]);

  // Update overall weekly progress when goals change
  useEffect(() => {
    calculateWeeklyOverallProgress();
  }, [goals]);

  // Function to play typewriter sound
  const playTypewriterSound = () => {
    if (typewriterSoundRef.current) {
      typewriterSoundRef.current.currentTime = 0;
      typewriterSoundRef.current.play();
    }
  };

  // Achievement Squares Data
  const totalWeeks = 52; // You can adjust this as needed
  const achievementWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div
      className={`p-4 ${
        settings && settings.darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-black'
      } min-h-screen`}
    >
      {/* Weekly Goals Title */}
      <h1 className="text-2xl font-bold mb-4">Weekly Goals</h1>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">
            Goal tasks this week: {weeklyProgress}/{weeklyTarget}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full"
            style={{
              backgroundColor: '#4CAF50',
              width: `${weeklyTarget > 0 ? (weeklyProgress / weeklyTarget) * 100 : 0}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Achievement Slider */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Achievements</h2>
        <div className="flex space-x-4 overflow-x-auto mt-2">
          {achievementWeeks.map((week) => (
            <div
              key={week}
              className="flex flex-col items-center bg-gray-100 p-2 rounded-lg w-24 flex-shrink-0"
            >
              {/* Achievement Icon */}
              {week <= weeksCompleted ? (
                <span className="text-4xl mb-1">{getEmojiByWeek(week)}</span>
              ) : (
                <Lock size={32} className="text-gray-500 mb-1" />
              )}
              {/* Achievement Title */}
              <span className="text-sm text-center">Week {week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goals List */}
      <div
        className={`${
          settings && settings.darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-black'
        } rounded-lg shadow p-4 mb-6`}
      >
        {goals.map((goal) => (
          <div key={goal.id} className="mb-6">
            {/* Goal Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {/* Color Circle */}
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
                {/* Goal Title and Progress */}
                <span className="text-lg font-semibold">
                  {goal.title} ({goal.progress}/{goal.target})
                </span>
              </div>
              {/* Edit and Delete Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(goal)}
                  className="p-1 text-blue-500 hover:text-blue-700"
                  title="Edit Goal"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete Goal"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full"
                style={{
                  backgroundColor: goal.color,
                  width: `${Math.min((goal.progress / goal.target) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Achievement and Add Goal Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setIsAddGoalModalOpen(true)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <PlusCircle size={20} className="mr-2" /> Add Goal
        </button>
      </div>

      {/* Add Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`${
              settings && settings.darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-black'
            } rounded-lg shadow-lg p-6 w-96`}
          >
            <h2 className="text-xl font-bold mb-4">Add New Goal</h2>
            <input
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="Goal Name"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="mb-4">
              <label className="block mb-1">How many times per week:</label>
              <input
                type="number"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
                min="1"
                max="100"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Choose Color:</label>
              <div className="flex space-x-2">
                {[
                  '#FF5733',
                  '#33FF57',
                  '#3357FF',
                  '#F0FF33',
                  '#FF33F0',
                  '#33FFF0',
                  '#FFA833',
                  '#AA33FF',
                  '#33FFAA',
                  '#FF3333',
                ].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full ${
                      newGoalColor === color ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGoalColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddGoalModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {isEditGoalModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`${
              settings && settings.darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-black'
            } rounded-lg shadow-lg p-6 w-96`}
          >
            <h2 className="text-xl font-bold mb-4">Edit Goal</h2>
            <input
              type="text"
              value={editedGoalName}
              onChange={(e) => setEditedGoalName(e.target.value)}
              placeholder="Goal Name"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="mb-4">
              <label className="block mb-1">How many times per week:</label>
              <input
                type="number"
                value={editedGoalTarget}
                onChange={(e) => setEditedGoalTarget(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
                min="1"
                max="100"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Choose Color:</label>
              <div className="flex space-x-2">
                {[
                  '#FF5733',
                  '#33FF57',
                  '#3357FF',
                  '#F0FF33',
                  '#FF33F0',
                  '#33FFF0',
                  '#FFA833',
                  '#AA33FF',
                  '#33FFAA',
                  '#FF3333',
                ].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full ${
                      editedGoalColor === color ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditedGoalColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditGoalModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedGoal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Popup */}
      {isAchievementPopupOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
            <span className="text-6xl mb-4">{popupEmoji}</span>
            <p className="text-lg mb-4 text-center">{popupMessage}</p>
            <button
              onClick={() => setIsAchievementPopupOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Audio Element */}
      <audio ref={typewriterSoundRef} src={typewriterSound} />
    </div>
  );
};


export default GoalsPage;