'use client';

import { useFollowUps } from '@/hooks/useFollowUps';

interface FollowUpCheckerProps {
  onNotified?: () => void;
}

export default function FollowUpChecker({ onNotified }: FollowUpCheckerProps) {
  useFollowUps(onNotified);
  return null;
}
