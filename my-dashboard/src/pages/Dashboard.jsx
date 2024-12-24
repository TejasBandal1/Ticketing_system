import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import TrendsCard from "../components/TrendsCard";
import DetailsCard from "../components/DetailsCard";
import CreateSupportTicket from "../components/CreateSupportTicket";
import AdminDashboard from "../components/AdminDashboard"; // Import AdminDashboard
import SupportPage from "../components/SupportPage"; // Import SupportPage
import SettingsPage from "../components/SettingsPage"; // Import SettingsPage
import ContactsPage from "../components/ContactsPage"; // Import ContactsPage
import TicketManagement from "../components/TicketManagement"; // Import TicketManagement

const Dashboard = () => {
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [currentPage, setCurrentPage] = useState("dashboard"); // Default page is "dashboard"

    // Handle new ticket creation
    const handleNewClick = () => {
        setIsCreatingTicket(true); // Show the support ticket creation form
    };

    // Handle cancel ticket creation
    const handleCancelTicket = () => {
        setIsCreatingTicket(false); // Close the support ticket form
    };

    // Handle search functionality
    const handleSearch = (term) => {
        console.log("Searching for:", term); // Replace this with actual search functionality
    };

    // Handle card click (for demonstration)
    const handleCardClick = (title) => {
        alert(`Clicked on ${title} card!`); // Replace with functionality if needed
    };

    // Handle navigation to different pages
    const handleNavigation = (page) => {
        setCurrentPage(page); // Update the current page
        if (page === "Tickets") {
            setIsCreatingTicket(true); // Special case: open ticket form for "Tickets"
        } else {
            setIsCreatingTicket(false); // Close the ticket form for other pages
        }
    };

    // Render the page based on the current page state
    const renderPage = () => {
        switch (currentPage) {
            case "users":
                return <AdminDashboard />; // Render Admin Dashboard
            case "products":
                return <SupportPage />; // Render Support Page
            case "contacts":
                return <ContactsPage />; // Render Contacts Page
            case "settings":
                return <SettingsPage />; // Render Settings Page
            case "ticket-management":
                return <TicketManagement />; // Render Ticket Management Page
            case "Tickets":
                return (
                    <CreateSupportTicket onCancel={handleCancelTicket} /> // Render Create Ticket Page
                );
            default:
                return (
                    <>
                        <Header onSearch={handleSearch} onNewClick={handleNewClick} />
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {["Unresolved", "Overdue", "Due today", "Open", "On hold", "Unassigned"].map(
                                (title, i) => (
                                    <DashboardCard
                                        key={i}
                                        title={title}
                                        value={Math.floor(Math.random() * 10)}
                                        onClick={() => handleCardClick(title)}
                                    />
                                )
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <TrendsCard />
                            <DetailsCard title="Unresolved tickets" details={[{ label: "Group", value: "Open" }]} />
                            <DetailsCard title="To-do" details={[{ label: "No tasks", value: "" }]} />
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="flex h-screen">
            <Sidebar onNavigate={handleNavigation} />
            <main className="flex-1 p-6">
                {isCreatingTicket ? (
                    <CreateSupportTicket onCancel={handleCancelTicket} /> // Ticket creation form
                ) : (
                    renderPage() // Render the active page
                )}
            </main>
        </div>
    );
};

export default Dashboard;
