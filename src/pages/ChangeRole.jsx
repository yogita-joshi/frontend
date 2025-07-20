import React, { useEffect, useState } from "react";
import axios from "axios";

const ChangeRole = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser ? currentUser._id : null;

  console.log("Current User from localStorage:", currentUser);
  console.log("Current User ID:", currentUserId);

  const handleRoleChange = async (id, newRole) => {
    setError(null); // Clear previous errors
    console.log(`Attempting to change role for ID: ${id} to new role: ${newRole}`);

    try {
      // 1. Optimistically update the local state *before* the API call.
      // This provides immediate visual feedback to the user.
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u => {
          if (u._id === id) {
            console.log(`Updating user ID ${u._id} from role ${u.role} to ${newRole} (optimistic)`);
            return { ...u, role: newRole }; // Create a new object for the updated user
          }
          return u; // Return other users as they are
        });
        console.log("Optimistically updated users state:", updatedUsers);
        return updatedUsers;
      });

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      // Make the API call to update the role on the backend
      const response = await axios.put( // Capture response for debugging
        `http://localhost:5170/api/users/${id}/role`, // <<< VERIFY THIS PORT AND ENDPOINT
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log("Backend update successful:", response.data);


      // 2. If the updated user is the currently logged-in user, update localStorage.
      if (id === currentUserId) {
        const updatedUserInLocalStorage = { ...currentUser, role: newRole };
        localStorage.setItem("user", JSON.stringify(updatedUserInLocalStorage));
        console.log("localStorage user role updated to:", newRole);
      }

      // 3. (Optional but recommended for consistency) Re-fetch all users to ensure
      //    the local state is perfectly in sync with the backend, in case
      //    there were other concurrent changes or initial optimistic update was wrong.
      //    This is especially important if your backend applies additional logic or
      //    returns a slightly different user object.
      await fetchUsers(); // Await this to ensure it completes before further actions if any
      console.log("Re-fetched users after successful update.");

    } catch (err) {
      console.error("Error changing role:", err);
      setError(err.response?.data?.message || "Failed to update role. Please try again.");

      // IMPORTANT: Revert the optimistic UI update if the API call fails
      // By re-fetching, you essentially revert to the actual state from the server.
      console.log("API call failed, re-fetching to revert optimistic update.");
      await fetchUsers(); // Re-fetch from the server to get the actual (un-changed) state
    }
  };

  const fetchUsers = async () => {
    setError(null); // Clear previous errors
    console.log("Fetching users...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. Cannot fetch users.");
        // Consider redirecting to login or showing a specific message
        // navigate('/login'); // Uncomment if you have navigate imported and want to redirect
        return;
      }

      const res = await axios.get("http://localhost:5170/api/users", { // <<< VERIFY THIS PORT AND ENDPOINT
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Users fetched successfully:", res.data);

      // --- IMPORTANT CHECK HERE ---
      // Log the structure of the fetched user objects to see if '_id' exists
      // This check helps confirm if your backend is sending the necessary data.
      if (res.data && res.data.length > 0) {
        console.log("First fetched user object structure:", res.data);
        if (!res.data[0]._id) {
          console.error("CRITICAL: Fetched user objects do not have an '_id' property. Check backend user model.");
        }
      }
      // --- END IMPORTANT CHECK ---

      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to fetch users.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container" id = "change role ">
      <h2>User Role Management</h2> 
      {error && <p style={{ color: 'red'}}>{error}</p>}
      <table><br />
        <thead>
          <tr><br /><br />
            <th>Name</th><br />
            <th>Email</th><br />
            <th>Current Role</th><br /> 
            <th>Change Role</th><br />
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && !error ? (
            <tr><td colSpan="4">Loading users...</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u._id}><br /><br />
                <td>{u.username}</td><br />
                <td>{u.email}</td><br />
                <td>{u.role}</td><br />
                <td><br />
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="team-lead">team-lead</option>
                    <option value="engineer">engineer</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ChangeRole;