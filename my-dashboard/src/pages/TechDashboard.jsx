import React from "react";

const TechDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-teal-600">Tech Team Dashboard</h1>
      <p className="mb-6 text-lg text-gray-700">Welcome to the tech team dashboard. Manage technical operations, view issues, and track tasks here.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Section for Tech-Specific Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-teal-600 mb-4">Active Tasks</h2>
          <ul className="list-disc list-inside">
            <li>Fix issue with the login page</li>
            <li>Update server configuration</li>
            <li>Monitor system performance</li>
          </ul>
        </div>

        {/* Section for Ticketing System */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-teal-600 mb-4">Open Tickets</h2>
          <ul className="list-disc list-inside">
            <li>Ticket #1123 - Website downtime</li>
            <li>Ticket #1124 - API request delay</li>
            <li>Ticket #1125 - Database optimization</li>
          </ul>
        </div>

        {/* Section for System Stats */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-teal-600 mb-4">System Stats</h2>
          <div className="text-gray-700">
            <p>CPU Usage: 75%</p>
            <p>Memory Usage: 60%</p>
            <p>Disk Space: 85% used</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;
