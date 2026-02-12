import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../lib/authProvider";
import { Layout } from "../components/Layout";
import { RequireAuth } from "../components/RequireAuth";

import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { Signup } from "../pages/Signup";
import { Profile } from "../pages/Profile";
import { Plannings } from "../pages/Plannings";
import { PlanningDetail } from "../pages/PlanningDetail";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            <Route
              path="/plannings"
              element={
                <RequireAuth>
                  <Plannings />
                </RequireAuth>
              }
            />

            <Route
              path="/plannings/:id"
              element={
                <RequireAuth>
                  <PlanningDetail />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
