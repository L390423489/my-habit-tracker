//MonthView.js

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const MonthView = ({ tasks, setTasks, goals, openEditModal, settings }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayTasks, setDayTasks] = useState([]);

  const getDateString = (date) => date.toLocaleDateString('en-CA');

  const handleDayClick = (date) => {
    setSelectedDate(date);
    const dateString = getDateString(date);
    const tasksForDay = tasks.filter(
      (task) => task.dates && task.dates.includes(dateString)
    );
    setDayTasks(tasksForDay);
  };

  const CustomDayContent = (day) => {
    const dateString = getDateString(day.date);
    const dayTasks = tasks.filter(
      (task) => task.dates && task.dates.includes(dateString)
    );

    const isImportant = dayTasks.some((task) => task.important);
    const hasBackground = dayTasks.some((task) => task.backgroundColor);

    return (
      <div className="relative">
        {hasBackground && (
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: dayTasks[0].backgroundColor }}
          ></div>
        )}
        <div className="relative z-10">{day.date.getDate()}</div>
        {isImportant && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </h1>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleDayClick}
        components={{
          DayContent: CustomDayContent,
        }}
      />

      {/* Display tasks for the selected day */}
      <div className="mt-4">
        <h2 className="text-lg font-bold mb-2">
          Tasks for {selectedDate.toDateString()}
        </h2>
        {dayTasks.length === 0 ? (
          <p>No tasks for this day.</p>
        ) : (
          <ul>
            {dayTasks.map((task) => (
              <li
                key={task.id}
                className="mb-2 p-2 bg-white rounded shadow"
                onDoubleClick={() => openEditModal(task)}
              >
                <div className="flex items-center justify-between">
                  <span>{task.title}</span>
                  {task.important && (
                    <span className="ml-2 text-red-500 font-bold">*</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MonthView;
