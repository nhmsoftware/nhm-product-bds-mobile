import { MandatoryCourseGate, ShowingClientScreen } from "@/components/EmployeeScreens";

export default function ShowingClientRoute() {
  return (
    <MandatoryCourseGate returnTo="/employee/showing-client">
      <ShowingClientScreen />
    </MandatoryCourseGate>
  );
}
