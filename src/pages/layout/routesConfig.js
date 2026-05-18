import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiHome,
  FiMessageSquare,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUsers
} from "react-icons/fi";


export const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/job-openings", label: "Job Openings", icon: FiBriefcase },
  { to: "/candidates", label: "Candidates", icon: FiUsers },
  { to: "/interviews", label: "Interviews", icon: FiUserCheck },
  { to: "/clients", label: "Client", icon: FiUser },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
  // { to: "/calendar", label: "Calendar", icon: FiCalendar }, // Disabled for later
  // { to: "/users", label: "User Roles", icon: FiUserPlus }, // Disabled for later
];

