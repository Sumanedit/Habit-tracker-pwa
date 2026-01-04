import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth, subMonths } from 'date-fns';
import { useHabits, useMonthlyCompletions, useToggleCompletion } from '../habits/hooks';
import { Completion, Habit } from '../../types/habit';

function buildHeatmapData(completions: Completion[], start: Date, end: Date) {
  const days: Array<[string, number]> = [];
  for (let dt = start; dt <= end; dt = addDays(dt, 1)) {
    const dateStr = format(dt, 'yyyy-MM-dd');
    const count = completions.filter((c) => c.date === dateStr && c.completed).length;
    days.push([dateStr, count]);
  }
  return days;
}

function completionRatio(completions: Completion[], habits: Habit[]): { habit: Habit; ratio: number } | null {
  if (!habits.length) return null;
  const totals = habits.map((habit) => {
    const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
    const done = habitCompletions.filter((c) => c.completed).length;
    const ratio = habitCompletions.length ? done / habitCompletions.length : 0;
    return { habit, ratio };
  });
  return totals.sort((a, b) => b.ratio - a.ratio)[0] ?? null;
}

function longestStreak(completions: Completion[], habitId: string): number {
  const habitCompletions = completions
    .filter((c) => c.habit_id === habitId && c.completed)
    .map((c) => parseISO(c.date))
    .sort((a, b) => a.getTime() - b.getTime());
  let streak = 0;
  let maxStreak = 0;
  for (let i = 0; i < habitCompletions.length; i++) {
    if (i === 0 || habitCompletions[i].getTime() - habitCompletions[i - 1].getTime() === 24 * 60 * 60 * 1000) {
      streak += 1;
    } else {
      streak = 1;
    }
    maxStreak = Math.max(maxStreak, streak);
  }
  return maxStreak;
}

export function Dashboard() {
  const habitsQuery = useHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const completionsQuery = useMonthlyCompletions(currentMonth);
  const toggleCompletion = useToggleCompletion(currentMonth);
  const habits = habitsQuery.data ?? [];
  const completions = completionsQuery.data ?? [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startOfRange = monthStart;
  const endOfRange = monthEnd;

  const heatmapData = useMemo(
    () => buildHeatmapData(completions, startOfRange, endOfRange),
    [completions, startOfRange, endOfRange]
  );

  const mostConsistent = useMemo(() => completionRatio(completions, habits), [completions, habits]);
  const streaks = useMemo(
    () =>
      habits.map((habit) => ({
        habit,
        streak: longestStreak(completions, habit.id)
      })),
    [habits, completions]
  );

  const monthlyPct = useMemo(() => {
    const daysInMonth = endOfRange.getDate();
    const totalPossible = daysInMonth * habits.length || 1;
    const totalDone = completions.filter((c) => c.completed).length;
    return Math.round((totalDone / totalPossible) * 100);
  }, [completions, habits.length, endOfRange]);

  const categoryPie = useMemo(() => {
    const daysCount = daysInMonth.length;
    return habits.map((habit) => {
      const habitCompletions = completions.filter((c) => c.habit_id === habit.id && c.completed);
      const completionRate = daysCount > 0 ? Math.round((habitCompletions.length / daysCount) * 100) : 0;
      return {
        name: `${habit.name} (${completionRate}%)`,
        value: completionRate
      };
    }).filter(item => item.value > 0);
  }, [completions, habits, daysInMonth]);

  const dailyBar = useMemo(() => {
    const days = Array.from({ length: endOfRange.getDate() }, (_, i) => i + 1);
    return days.map((day) => {
      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
      const count = completions.filter((c) => c.date === dateStr && c.completed).length;
      return count;
    });
  }, [completions, endOfRange, currentMonth]);

  const lineSeries = useMemo(() => {
    let running = 0;
    const days = Array.from({ length: endOfRange.getDate() }, (_, i) => i + 1);
    return days.map((day) => {
      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
      running += completions.filter((c) => c.date === dateStr && c.completed).length;
      return running;
    });
  }, [completions, endOfRange, currentMonth]);

  const dailyProgressPct = useMemo(() => {
    const days = Array.from({ length: endOfRange.getDate() }, (_, i) => i + 1);
    return days.map((day) => {
      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
      const done = completions.filter((c) => c.date === dateStr && c.completed).length;
      const possible = habits.length || 1;
      return Math.round((done / possible) * 100);
    });
  }, [completions, habits.length, endOfRange, currentMonth]);

  const weekGroups = useMemo(() => {
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    daysInMonth.forEach((day) => {
      if (week.length === 0 || getDay(day) === 1) {
        if (week.length > 0) weeks.push(week);
        week = [day];
      } else {
        week.push(day);
      }
    });
    if (week.length > 0) weeks.push(week);
    return weeks;
  }, [daysInMonth]);

  const overallProgress = useMemo(() => {
    const totalPossible = habits.length * daysInMonth.length;
    const totalDone = completions.filter(c => c.completed).length;
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  }, [habits, completions, daysInMonth]);

  const handleToggle = (habitId: string, date: Date, completed: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    toggleCompletion.mutate({ habitId, date: dateStr, completed });
  };

  const isCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.some((c) => c.habit_id === habitId && c.date === dateStr && c.completed);
  };

  const getAnalysis = (habit: Habit) => {
    const goal = daysInMonth.length;
    const actual = completions.filter(c => c.habit_id === habit.id && c.completed).length;
    const progress = goal > 0 ? Math.round((actual / goal) * 100) : 0;
    return { goal, actual, progress };
  };

  if (habitsQuery.isLoading || completionsQuery.isLoading) {
    return <div className="page">Loading analytics...</div>;
  }

  return (
    <div className="page">
      <section className="charts-grid">
        <div className="chart-card">
          <h4>Monthly Heatmap</h4>
          <ReactECharts
            option={{
              tooltip: {},
              visualMap: {
                min: 0,
                max: Math.max(1, habits.length),
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                inRange: {
                  color: ['#f0fdf4', '#86efac', '#22c55e', '#15803d', '#14532d']
                }
              },
              calendar: {
                range: [format(startOfRange, 'yyyy-MM-dd'), format(endOfRange, 'yyyy-MM-dd')],
                splitLine: { show: false },
                cellSize: ['auto', 18]
              },
              series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: heatmapData
              }]
            }}
            style={{ height: 260 }}
          />
        </div>

        <div className="chart-card">
          <h4>Daily Completions (bar)</h4>
          <ReactECharts
            option={{
              tooltip: {},
              xAxis: { type: 'category', data: Array.from({ length: endOfRange.getDate() }, (_, i) => i + 1) },
              yAxis: { type: 'value' },
              series: [{ type: 'bar', data: dailyBar }]
            }}
            style={{ height: 260 }}
          />
        </div>

        <div className="chart-card">
          <h4>Cumulative Completions (line)</h4>
          <ReactECharts
            option={{
              tooltip: {},
              xAxis: { type: 'category', data: Array.from({ length: endOfRange.getDate() }, (_, i) => i + 1) },
              yAxis: { type: 'value' },
              series: [{ type: 'line', data: lineSeries, smooth: true }]
            }}
            style={{ height: 260 }}
          />
        </div>

        <div className="chart-card">
          <h4>Habit Distribution</h4>
          <ReactECharts
            option={{
              tooltip: { trigger: 'item' },
              legend: { show: false },
              series: [
                {
                  type: 'pie',
                  radius: '60%',
                  data: categoryPie
                }
              ]
            }}
            style={{ height: 260 }}
          />
        </div>
      </section>

      {/* Habit Tracker Section */}
      <section className="habit-tracker-dashboard">
        <div className="month-header-dashboard">
          <div className="month-nav">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</button>
            <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</button>
          </div>
          <div className="progress-bar-container">
            <span className="progress-label">Progress</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="progress-percent"></span>
            <span className="progress-percent-value">{overallProgress}%</span>
          </div>
        </div>

        <div className="calendar-table-dashboard">
          <table>
            <thead>
              <tr>
                <th className="habits-col-dashboard">
                  <div className="habits-header-dashboard">My Habits</div>
                </th>
                {weekGroups.map((week, weekIdx) => (
                  <th key={weekIdx} colSpan={week.length} className="week-header-dashboard">
                    Week {weekIdx + 1}
                  </th>
                ))}
                <th className="analysis-col-dashboard">Analysis</th>
              </tr>
              <tr>
                <th></th>
                {daysInMonth.map((day) => (
                  <th key={day.toISOString()} className="day-header-dashboard">
                    <div className="day-label-dashboard">{format(day, 'EEE').substring(0, 2)}</div>
                    <div className="day-num-dashboard">{format(day, 'd')}</div>
                  </th>
                ))}
                <th className="analysis-header-dashboard">
                  <div className="analysis-cols-dashboard">
                    <span>Goal</span>
                    <span>Actual</span>
                    <span>Progress</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth.length + 2} className="empty-state-dashboard">
                    No habits tracked yet. Visit the Habits page to add habits!
                  </td>
                </tr>
              ) : (
                habits.map((habit) => {
                  const analysis = getAnalysis(habit);
                  return (
                    <tr key={habit.id}>
                      <td className="habit-name-cell-dashboard">
                        <span className="habit-name-dashboard">{habit.name}</span>
                      </td>
                      {daysInMonth.map((day) => (
                        <td key={day.toISOString()} className="day-cell-dashboard">
                          <input
                            type="checkbox"
                            checked={isCompleted(habit.id, day)}
                            onChange={(e) => handleToggle(habit.id, day, e.target.checked)}
                          />
                        </td>
                      ))}
                      <td className="analysis-cell-dashboard">
                        <div className="analysis-data-dashboard">
                          <span>{analysis.goal}</span>
                          <span>{analysis.actual}</span>
                          <div className="mini-bar-dashboard">
                            <div className="mini-bar-fill-dashboard" style={{ width: `${analysis.progress}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <h3>Monthly Completion %</h3>
          <p className="metric">{Number.isNaN(monthlyPct) ? '0%' : `${monthlyPct}%`}</p>
        </div>
        <div className="card">
          <h3>Most Consistent</h3>
          <p className="metric">{mostConsistent?.habit.name ?? 'N/A'}</p>
          <p className="sub">{mostConsistent ? Math.round(mostConsistent.ratio * 100) + '%' : ''}</p>
        </div>
        <div className="card">
          <h3>Longest Streak</h3>
          <p className="metric">
            {streaks.sort((a, b) => b.streak - a.streak)[0]?.streak ?? 0} days
          </p>
        </div>
      </section>

      <section className="progress-chart-section">
        <div className="progress-chart-card">
          <h3>Monthly Progress</h3>
          <ReactECharts
            option={{
              tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c}%'
              },
              grid: {
                left: '3%',
                right: '3%',
                top: '10%',
                bottom: '10%',
                containLabel: true
              },
              xAxis: {
                type: 'category',
                boundaryGap: false,
                data: Array.from({ length: endOfRange.getDate() }, (_, i) => i + 1),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                  interval: 4,
                  color: '#9ca3af'
                }
              },
              yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                interval: 20,
                axisLabel: {
                  formatter: '{value}%',
                  color: '#9ca3af'
                },
                splitLine: {
                  lineStyle: {
                    color: '#374151',
                    type: 'dashed'
                  }
                }
              },
              series: [
                {
                  type: 'line',
                  data: dailyProgressPct,
                  smooth: true,
                  symbol: 'circle',
                  symbolSize: 6,
                  lineStyle: {
                    color: '#22c55e',
                    width: 2
                  },
                  itemStyle: {
                    color: '#22c55e'
                  },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(134, 239, 172, 0.6)' },
                        { offset: 1, color: 'rgba(134, 239, 172, 0.1)' }
                      ]
                    }
                  }
                }
              ]
            }}
            style={{ height: 200, width: '100%' }}
          />
        </div>
      </section>
    </div>
  );
}
