export const CLIENT_TABLE_STORAGE_KEY = "clients:table:v1";

export const DEFAULT_CLIENTS = [
  {
    clientId: "CL001",
    clientName: "ABC Technologies",
    contactNumber: "9876543210",
    contactEmail: "contact@abctech.com",
    primaryContactPerson: "Rajesh Kumar",
    secondaryContactPerson: "Neha Kapoor",
    accountManager: "Neha Verma",
    activeFrom: "2024-01-01",
    clientStatus: "Active",
    comments: "Enterprise account focused on Java and cloud hiring.",
    clientLocation: "Bangalore",
  },
  {
    clientId: "CL002",
    clientName: "Nova Solutions",
    contactNumber: "9876543211",
    contactEmail: "hr@novasolutions.com",
    primaryContactPerson: "Priya Sharma",
    secondaryContactPerson: "Amit Shah",
    accountManager: "Arun Kumar",
    activeFrom: "2024-02-15",
    clientStatus: "Active",
    comments: "Scaling product and QA hiring this quarter.",
    clientLocation: "Pune",
  },
  {
    clientId: "CL003",
    clientName: "PixelSoft Pvt Ltd",
    contactNumber: "9876543212",
    contactEmail: "careers@pixelsoft.com",
    primaryContactPerson: "Anil Mehta",
    secondaryContactPerson: "Ritika Jain",
    accountManager: "Sneha Iyer",
    activeFrom: "2024-03-10",
    clientStatus: "Active",
    comments: "Hiring for UI and backend roles.",
    clientLocation: "Chennai",
  },
  {
    clientId: "CL004",
    clientName: "FinEdge Systems",
    contactNumber: "9876543213",
    contactEmail: "hr@finedge.com",
    primaryContactPerson: "Kavita Rao",
    secondaryContactPerson: "Rohan Das",
    accountManager: "Vikram Singh",
    activeFrom: "2024-04-25",
    clientStatus: "On Hold",
    comments: "Paused due to budget approval cycle.",
    clientLocation: "Mumbai",
  },
  {
    clientId: "CL005",
    clientName: "CloudNet Corp",
    contactNumber: "9876543214",
    contactEmail: "contact@cloudnet.com",
    primaryContactPerson: "Suresh Nair",
    secondaryContactPerson: "Ira Menon",
    accountManager: "Karthik M",
    activeFrom: "2024-05-05",
    clientStatus: "Active",
    comments: "Critical roles in DevOps and SRE.",
    clientLocation: "Hyderabad",
  },
  {
    clientId: "CL006",
    clientName: "Insight Labs",
    contactNumber: "9876543215",
    contactEmail: "hr@insightlabs.com",
    primaryContactPerson: "Ananya Rao",
    secondaryContactPerson: "Pooja Mehta",
    accountManager: "Pooja Mehta",
    activeFrom: "2024-06-18",
    clientStatus: "Inactive",
    comments: "No active requirement at the moment.",
    clientLocation: "Coimbatore",
  },
  {
    clientId: "CL007",
    clientName: "CodeBase Solutions",
    contactNumber: "9876543216",
    contactEmail: "jobs@codebase.com",
    primaryContactPerson: "Rohit Verma",
    secondaryContactPerson: "Neha Gupta",
    accountManager: "Ravi Patel",
    activeFrom: "2024-07-01",
    clientStatus: "Active",
    comments: "Long-term hiring partnership.",
    clientLocation: "Delhi",
  },
  {
    clientId: "CL008",
    clientName: "BrandHive Digital",
    contactNumber: "9876543217",
    contactEmail: "hello@brandhive.com",
    primaryContactPerson: "Neha Gupta",
    secondaryContactPerson: "Aarav Sharma",
    accountManager: "Sneha Iyer",
    activeFrom: "2024-08-12",
    clientStatus: "On Hold",
    comments: "Campaign hiring delayed until next release.",
    clientLocation: "Noida",
  },
];

export const loadClientRows = () => {
  if (typeof window === "undefined") return DEFAULT_CLIENTS;

  try {
    const savedData = window.localStorage.getItem(CLIENT_TABLE_STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : null;
    if (Array.isArray(parsedData)) {
      return parsedData;
    }
  } catch (error) {
    console.error("Failed to load saved clients:", error);
  }

  return DEFAULT_CLIENTS;
};

export const saveClientRows = (rows) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CLIENT_TABLE_STORAGE_KEY, JSON.stringify(rows));
  } catch (error) {
    console.error("Failed to save clients:", error);
  }
};

export const getClientOptions = (rows = []) => {
  const seen = new Set();

  return rows.reduce((options, client) => {
    const clientName = String(client?.clientName || "").trim();
    const clientId = String(client?.clientId || client?.clientID || "").trim();
    if (!clientName || !clientId) return options;

    const optionKey = `${clientId.toLowerCase()}::${clientName.toLowerCase()}`;
    if (seen.has(optionKey)) return options;
    seen.add(optionKey);

    options.push({
      value: clientName,
      label: clientName,
      clientId,
      id: clientId,
    });

    return options;
  }, []);
};
