// MonthView.js

import React, { useState, useEffect } from 'react';

const MonthView = ({
  tasks,
  setTasks,
  goals,
  openEditModal,
  settings,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [totalWorkHours, setTotalWorkHours] = useState(0);

  // Helper function to format date as 'YYYY-MM-DD'
  const getDateString = (date) => date.toLocaleDateString('en-CA');

  // Function to generate the days for the current month
  const generateMonthDays = () => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayWeekday = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

    // Get the number of days in the month
    const numDaysInMonth = new Date(year, month + 1, 0).getDate();

    // Create an array of all days in the month
    const monthDays = [];

    // Add empty days for the previous month
    for (let i = 0; i < firstDayWeekday; i++) {
      monthDays.push(null);
    }

    // Add days of the current month
    for (let day = 1; day <= numDaysInMonth; day++) {
      monthDays.push(new Date(year, month, day));
    }

    return monthDays;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (date) => {
    const dateString = getDateString(date);
    const tasksForDate = tasks.filter(
      (task) => task.dates && task.dates.includes(dateString)
    );
    setSelectedDayTasks(tasksForDate);
    setShowTasksModal(true);
  };

  // Calculate the total number of tasks for the month
  useEffect(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthDates = [];
    for (
      let date = new Date(monthStart);
      date <= monthEnd;
      date.setDate(date.getDate() + 1)
    ) {
      monthDates.push(getDateString(new Date(date)));
    }

    let totalTasks = 0;
    tasks.forEach((task) => {
      if (task.dates.some((date) => monthDates.includes(date))) {
        totalTasks += 1;
      }
    });
    setTotalTasksCount(totalTasks);
  }, [tasks, currentMonth]);

  // Calculate total work hours for the month
  useEffect(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthDates = [];
    for (
      let date = new Date(monthStart);
      date <= monthEnd;
      date.setDate(date.getDate() + 1)
    ) {
      monthDates.push(getDateString(new Date(date)));
    }

    let totalHours = 0;
    tasks.forEach((task) => {
      if (
        task.isShift &&
        task.dates.some((date) => monthDates.includes(date))
      ) {
        const numOccurrences = task.dates.filter((date) => monthDates.includes(date)).length;
        totalHours += (parseFloat(task.shiftDuration) || 0) * numOccurrences;
      }
    });
    setTotalWorkHours(totalHours);
  }, [tasks, currentMonth]);

  // Generate the month days
  const monthDays = generateMonthDays();

  // Weekday headers based on settings
  const weekStartsOnSunday = settings?.weekStartsOn === 'Sun';
  const weekdays = weekStartsOnSunday
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Adjust monthDays array if week starts on Monday
  if (!weekStartsOnSunday) {
    if (monthDays[0] === null) {
      monthDays.shift();
    } else {
      monthDays.unshift(null);
    }
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Header with Month and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-full hover:bg-gray-200"
        >
          &lt;
        </button>
        <h1 className="text-xl font-bold">
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h1>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-full hover:bg-gray-200"
        >
          &gt;
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-grow">
        {/* Weekday Headers */}
        {weekdays.map((day) => (
          <div key={day} className="text-center font-bold">
            {day}
          </div>
        ))}

        {/* Calendar Cells */}
        {monthDays.map((date, index) => {
          if (!date) {
            return <div key={index}></div>; // Empty cell
          } else {
            const dateString = getDateString(date);

            // Get tasks for this date
            const tasksForDate = tasks.filter(
              (task) => task.dates && task.dates.includes(dateString)
            );

            // Check for important tasks
            const isImportant = tasksForDate.some((task) => task.important);

            // Check for shifts
            const shiftTasks = tasksForDate.filter((task) => task.isShift);
            const shiftTask = shiftTasks.length > 0 ? shiftTasks[0] : null;

            return (
              <div
                key={index}
                className="border h-24 md:h-32 lg:h-40 relative cursor-pointer bg-white"
                onClick={() => handleDayClick(date)}
                style={{
                  backgroundColor: shiftTask
                    ? shiftTask.backgroundColor
                    : undefined,
                }}
              >
                <div className="absolute top-1 left-1 text-xs">
                  {date.getDate()}
                </div>
                {shiftTask && (
                  <div className="absolute bottom-1 right-1 text-xs font-bold">
                    {shiftTask.shiftLetter}
                  </div>
                )}
                {isImportant && (
                  <div
                    className="absolute bottom-1 left-1 w-3 h-3 bg-red-500 rounded-full border border-black"
                    style={{ borderWidth: '1px' }}
                  ></div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* Total Tasks and Total Work Hours for the Month */}
      <div className="mt-4 flex justify-between">
        <h2 className="text-lg font-bold">
          Total tasks this month: {totalTasksCount}
        </h2>
        <h2 className="text-lg font-bold">
          Total Work Hours: {totalWorkHours} hours
        </h2>
      </div>

      {/* Tasks Modal */}
      {showTasksModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div
            className="bg-white p-4 rounded shadow-lg w-96 relative max-h-full overflow-y-auto"
          >
            <h2 className="text-xl font-semibold mb-4">Tasks for the Day</h2>
            {selectedDayTasks.length > 0 ? (
              <ul>
                {selectedDayTasks.map((task) => (
                  <li
                    key={task.id}
                    className="border-b border-gray-200 py-2 flex justify-between items-center"
                  >
                    <div>
                      <span
                        className={`font-bold ${
                          task.important ? 'text-red-500' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isShift && (
                        <span className="ml-2 text-sm text-gray-600">
                          (Shift: {task.shiftDuration} hrs)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        openEditModal(task);
                        setShowTasksModal(false);
                      }}
                      className="text-blue-500 underline"
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tasks for this day.</p>
            )}
            <button
              onClick={() => setShowTasksModal(false)}
              className="mt-4 bg-gray-300 text-black p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;
