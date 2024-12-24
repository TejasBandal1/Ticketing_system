import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("Date created");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [emailSendingStates, setEmailSendingStates] = useState({});

  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  const statusOrder = { Open: 1, "In Progress": 2, Resolved: 3, Closed: 4 };

  const fetchTickets = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/tickets?skip=${(page - 1) * 10}&limit=10`
      );
      const ticketsData = response.data.tickets;
      if (ticketsData.length === 0) {
        setHasMore(false);
      } else {
        setTickets((prevTickets) => [...prevTickets, ...ticketsData]);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("Failed to load tickets. Please try again later.");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page]);

  useEffect(() => {
    if (tickets.length > 0) {
      setTickets(sortTickets(sortBy));
    }
  }, [sortBy, tickets]);

  const sortTickets = (sortOption) => {
    return [...tickets].sort((a, b) => {
      switch (sortOption) {
        case "Priority":
          return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
        case "Date created":
          return new Date(b.created_at) - new Date(a.created_at);
        case "Status":
          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
    setIsDropdownOpen(false);
  };

  const loadMoreTickets = () => {
    if (hasMore) {
      setPage(page + 1);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/tickets/${ticketId}/status`, {
        status: newStatus,
      });
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
      toast.success("Ticket status updated successfully!");
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update ticket status. Please try again.");
    }
  };

  const sendEmailNotification = async (ticketId) => {
    setEmailSendingStates((prevStates) => ({
      ...prevStates,
      [ticketId]: true,
    }));

    try {
      await axios.post(`http://127.0.0.1:8000/tickets/${ticketId}/notify`);
      toast.success("Email notification sent successfully!");
    } catch (error) {
      console.error("Failed to send email notification:", error);
      toast.error("Failed to send email notification. Please try again.");
    } finally {
      setEmailSendingStates((prevStates) => ({
        ...prevStates,
        [ticketId]: false,
      }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="flex justify-between items-center px-6 py-4 bg-teal-700 text-white shadow-md">
        <h1 className="text-xl font-semibold">Ticket Management</h1>
      </header>
      <main className="flex-1 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <button
              aria-label="Sort tickets by"
              className="bg-white border border-teal-500 px-4 py-2 rounded-lg text-teal-700 font-medium hover:bg-teal-50 transition"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Sort by: {sortBy}
              <i className="fas fa-caret-down ml-2"></i>
            </button>
            {isDropdownOpen && (
              <ul className="absolute mt-2 w-48 bg-white border border-teal-300 rounded-lg shadow-md">
                {["Date created", "Priority", "Status"].map((option) => (
                  <li
                    key={option}
                    className="px-4 py-2 text-teal-600 hover:bg-teal-50 cursor-pointer"
                    onClick={() => handleSortChange(option)}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white p-3 rounded-lg shadow-sm hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-teal-700 font-semibold text-sm">{ticket.subject}</h2>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      ticket.priority === "High"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mb-1">{ticket.description}</p>
                <div className="text-gray-500 text-xs space-y-1">
                  <p>
                    <strong>Status:</strong>{" "}
                    <select
                      className="border rounded-lg px-2 py-1 text-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={ticket.status || "Open"}
                      onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </p>
                  <p>
                    <strong>Email:</strong> {ticket.email}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => sendEmailNotification(ticket._id)}
                    disabled={emailSendingStates[ticket._id] || false}
                    className="px-3 py-1 mt-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                  >
                    {emailSendingStates[ticket._id] ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No tickets available.</p>
          )}
        </div>
        {hasMore ? (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMoreTickets}
              className="px-6 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
            >
              Load More
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">No more tickets available.</p>
        )}
      </main>
      <ToastContainer />
    </div>
  );
};

export default TicketManagement;
