import { MandatoryCourseGate, MeetClientScreen } from "@/components/EmployeeScreens";

export default function MeetClientRoute() {
  return (
    <MandatoryCourseGate returnTo="/employee/meet-client">
      <MeetClientScreen />
    </MandatoryCourseGate>
  );
}
