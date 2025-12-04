import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashBoardLayout from "./layouts/DashBoardLayout";
import DashBoardPage from "./pages/DashBoardPage";
import StudentsPage from "./pages/StudentsPage";
import AttendancePage from "./pages/AttendancePage";
import PaymentsPage from "./pages/PaymentsPage";
import FinancePage from "./pages/FinancePage";
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return children;
};
const App = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard/*"
        element={
          <RequireAuth>
            <DashBoardLayout>
              <Routes>
                <Route path="/" element={<DashBoardPage/>}/>
                <Route path="students" element={<StudentsPage/>}/>
                <Route path="attendance" element={<AttendancePage/>}/>
                <Route path="payments" element={<PaymentsPage/>}/>
                <Route path="finances" element={<FinancePage/>}/>
                <Route path="*"element={<Navigate to="/" replace/>}/>
              </Routes>
            </DashBoardLayout>
          </RequireAuth>
        }
      />
      {/* Default Route */}
      <Route path="" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
};

export default App;
