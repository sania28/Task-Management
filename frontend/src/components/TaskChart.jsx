import React from 'react';

const TaskChart = ({ title, data, type }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <p className="chart-empty">No data available</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count));
  const colors = {
    status: { todo: '#3B82F6', in_progress: '#F59E0B', completed: '#10B981', cancelled: '#EF4444' },
    priority: { low: '#10B981', medium: '#F59E0B', high: '#EF4444', urgent: '#DC2626' },
  };

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-item">
            <div className="bar-label">
              <span>{item._id}</span>
              <span className="bar-value">{item.count}</span>
            </div>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${(item.count / max) * 100}%`,
                  backgroundColor: colors[type][item._id],
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskChart;
