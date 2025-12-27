import React from 'react';
import { CaregiverRoutine } from '../components/ui/CaregiverRoutine';
import { PatientRoutine } from '../components/ui/PatientRoutine';
import { useRole } from '../contexts/RoleContext';

export default function RoutineScreen() {
  const { role } = useRole();

  if (role === 'caregiver') {
    return <CaregiverRoutine />;
  }

  return <PatientRoutine />;
}
